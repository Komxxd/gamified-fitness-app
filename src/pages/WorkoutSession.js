import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useWorkouts from '../hooks/useWorkouts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import './WorkoutSession.css';

const WorkoutSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [terminateDialog, setTerminateDialog] = useState(false);
  const [allSetsCompleted, setAllSetsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [terminating, setTerminating] = useState(false);
  const { currentUser } = useAuth();
  
  const { 
    getActiveWorkout, 
    updateWorkoutSet, 
    completeWorkout,
    updateUserXP,
    terminateWorkout
  } = useWorkouts();

  useEffect(() => {
    loadWorkoutSession();
  }, [sessionId]);

  const loadWorkoutSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workout = await getActiveWorkout();
      
      if (!workout) {
        console.log('No active workout found');
        navigate('/routines');
        return;
      }
      
      if (workout.id !== sessionId) {
        console.log('Session ID mismatch:', workout.id, sessionId);
        navigate('/routines');
        return;
      }
      
      // Sort exercises and their sets
      const sortedWorkout = {
        ...workout,
        workout_exercises: workout.workout_exercises
          .map(exercise => ({
            ...exercise,
            workout_sets: exercise.workout_sets
              .sort((a, b) => a.set_number - b.set_number)
          }))
          .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name))
      };
      
      setSession(sortedWorkout);
      
      // Set the first incomplete exercise as expanded
      const firstIncompleteExercise = sortedWorkout.workout_exercises
        .find(ex => !ex.workout_sets.every(set => set.completed));
      
      setExpandedExercise(firstIncompleteExercise?.id || sortedWorkout.workout_exercises[0]?.id);

      // Check completion status
      checkAllSetsCompleted(sortedWorkout);
    } catch (error) {
      console.error('Error loading workout session:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAllSetsCompleted = (workoutSession) => {
    if (!workoutSession?.workout_exercises) {
      console.log('No workout exercises found');
      setAllSetsCompleted(false);
      return false;
    }
    
    console.log('Checking completion status for exercises:', workoutSession.workout_exercises);
    
    const allCompleted = workoutSession.workout_exercises.every(exercise => {
      const setsCompleted = exercise.workout_sets.every(set => set.completed);
      console.log(`Exercise ${exercise.exercise.name}: ${setsCompleted ? 'completed' : 'not completed'}`);
      return setsCompleted;
    });
    
    console.log('All sets completed:', allCompleted);
    setAllSetsCompleted(allCompleted);
    return allCompleted;
  };

  const handleAccordionChange = (exerciseId) => (event, isExpanded) => {
    setExpandedExercise(isExpanded ? exerciseId : null);
  };

  const handleSetComplete = async (setId, exerciseId, isCompleted) => {
    try {
      console.log(`Attempting to update set ${setId} to ${isCompleted ? 'completed' : 'not completed'}`);
      
      // Find the current exercise and set
      const currentExercise = session.workout_exercises.find(e => e.id === exerciseId);
      if (!currentExercise) {
        throw new Error('Exercise not found');
      }

      // Update the set
      const updatedSet = await updateWorkoutSet(setId, { 
        completed: isCompleted,
        reps: currentExercise.target_reps || 0
      });

      if (!updatedSet) {
        throw new Error('Failed to update set');
      }

      console.log('Set updated successfully:', updatedSet);
      
      // Update the local state immediately
      const updatedSession = {
        ...session,
        workout_exercises: session.workout_exercises.map(exercise => {
          if (exercise.id === exerciseId) {
            return {
              ...exercise,
              workout_sets: exercise.workout_sets.map(set => 
                set.id === setId ? { ...set, completed: isCompleted } : set
              )
            };
          }
          return exercise;
        })
      };
      
      setSession(updatedSession);
      checkAllSetsCompleted(updatedSession);

      // Reload the session to get the latest data
      const freshWorkout = await getActiveWorkout();
      if (freshWorkout) {
        console.log('Reloading session with fresh data');
        setSession(freshWorkout);
        const isAllCompleted = checkAllSetsCompleted(freshWorkout);
        console.log('All sets completed status:', isAllCompleted);
      }
    } catch (error) {
      console.error('Error updating set:', error);
      setError(`Failed to update set: ${error.message}`);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await completeWorkout(sessionId);
      // Update user's XP with the routine's total XP
      if (session?.total_xp) {
        await updateUserXP(session.total_xp);
      }
      navigate('/routines');
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const calculateProgress = (exercise) => {
    if (!exercise.workout_sets || exercise.workout_sets.length === 0) return 0;
    const totalSets = exercise.workout_sets.length;
    const completedSets = exercise.workout_sets.filter(set => set.completed).length;
    return (completedSets / totalSets) * 100;
  };

  const handleBackClick = () => {
    // Instead of navigating directly, show the confirmation dialog
    setTerminateDialog(true);
  };

  const handleTerminateWorkout = async () => {
    try {
      setTerminating(true);
      setError(null);
      
      console.log(`Terminating workout session: ${sessionId}`);
      
      // 1. First delete all workout sets for this session
      const { data: exercises } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_session_id', sessionId);
        
      if (exercises && exercises.length > 0) {
        console.log('Deleting workout sets...');
        await supabase
          .from('workout_sets')
          .delete()
          .in('workout_exercise_id', exercises.map(ex => ex.id));
          
        // 2. Then delete all workout exercises
        console.log('Deleting workout exercises...');
        await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_session_id', sessionId);
      }
      
      // 3. Finally delete the workout session
      console.log('Deleting workout session...');
      await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId);
        
      console.log('Workout session terminated successfully');
      navigate('/routines');
      
    } catch (error) {
      console.error('Error terminating workout:', error);
      setError('Failed to terminate workout session. Please try again.');
    } finally {
      setTerminating(false);
      setTerminateDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <>
        <div className="workout-session-background"></div>
        <Box className="workout-session-container">
          <Box className="workout-session-header">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/routines')}
              className="back-button"
            >
              Back to Routines
            </Button>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="h2" className="workout-title" sx={{ mb: 2 }}>
                Workout Error
              </Typography>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="body1" sx={{ textAlign: 'center', mt: 2 }}>
                Please try again or start a different workout.
              </Typography>
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <div className="workout-session-background"></div>
      <Box className="workout-session-container">
        <Box className="workout-session-header">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackClick}
            className="back-button"
          >
            Back to Routines
          </Button>
          
          <Box className="workout-session-info">
            <Typography variant="h2" className="workout-title">
              Workout in Progress
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {allSetsCompleted ? (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  className="complete-workout-button"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setCompleteDialog(true)}
                  sx={{ 
                    fontSize: '1.2rem', 
                    padding: '12px 24px',
                    background: '#4caf50',
                    '&:hover': {
                      background: '#388e3c'
                    }
                  }}
                >
                  Complete Workout
                </Button>
              ) : (
                <Typography color="white" sx={{ mt: 1 }}>
                  Complete all sets to finish the workout
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="white" align="center">
            Total XP Available: {session.total_xp || 0}
          </Typography>
          <Typography variant="subtitle2" color="white" align="center">
            Sets Completed: {session.workout_exercises?.reduce((total, ex) => total + ex.sets_completed, 0) || 0} / 
            {session.workout_exercises?.reduce((total, ex) => total + ex.workout_sets.length, 0) || 0}
          </Typography>
        </Box>

        <List className="exercises-list">
          {session.workout_exercises?.map((exercise) => (
            <Accordion 
              key={exercise.id}
              expanded={expandedExercise === exercise.id}
              onChange={handleAccordionChange(exercise.id)}
              className="exercise-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className="exercise-summary"
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography className="exercise-name">
                      {exercise.exercise.name}
                    </Typography>
                    <Chip 
                      label={`${exercise.sets_completed}/${exercise.workout_sets.length} Sets`}
                      className={`progress-chip ${exercise.completed ? 'completed' : ''}`}
                      icon={exercise.completed ? <CheckCircleIcon /> : null}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress(exercise)} 
                    className="exercise-progress"
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails className="exercise-details">
                <Typography className="exercise-subtitle">
                  Target: {exercise.target_sets} sets × {exercise.target_reps} reps
                </Typography>
                
                <List className="sets-list">
                  {exercise.workout_sets?.sort((a, b) => a.set_number - b.set_number).map((set) => (
                    <ListItem key={set.id} className={`set-item ${set.completed ? 'completed' : ''}`}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={set.completed} 
                            onChange={(e) => handleSetComplete(
                              set.id, 
                              exercise.id, 
                              e.target.checked
                            )}
                            className="set-checkbox"
                          />
                        }
                        label={`Set ${set.set_number}`}
                        className="set-checkbox-label"
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>

        {/* Complete Workout Dialog */}
        <Dialog
          open={completeDialog}
          onClose={() => setCompleteDialog(false)}
          PaperProps={{
            sx: {
              background: '#1a1b2f',
              color: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <DialogTitle>Complete Workout</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Congratulations! You've completed all sets. Would you like to finish this workout and earn {session.total_xp} XP?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompleteDialog(false)}>Cancel</Button>
            <Button onClick={handleCompleteWorkout} color="primary">
              Complete Workout
            </Button>
          </DialogActions>
        </Dialog>

        {/* Terminate Workout Dialog */}
        <Dialog
          open={terminateDialog}
          onClose={() => setTerminateDialog(false)}
          PaperProps={{
            sx: {
              background: '#1a1b2f',
              color: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <DialogTitle>Terminate Workout Session</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Are you sure you want to terminate this workout session? All progress will be lost and no XP will be earned.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTerminateDialog(false)}>
              Stay on Page
            </Button>
            <Button 
              onClick={handleTerminateWorkout} 
              color="error"
              disabled={terminating}
            >
              {terminating ? 'Terminating...' : 'Terminate Workout'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default WorkoutSession; 