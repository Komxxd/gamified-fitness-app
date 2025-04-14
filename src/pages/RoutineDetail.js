import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useRoutines } from '../hooks/useRoutines';
import useWorkouts from '../hooks/useWorkouts';
import { useAuth } from '../contexts/AuthContext';
import { calculateExerciseXP } from '../utils/xpSystem';
import { supabase } from '../supabase';
import './RoutineDetail.css';

const RoutineDetail = () => {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const { getUserRoutines, removeExerciseFromRoutine } = useRoutines();
  const { startWorkout, getActiveWorkout, terminateWorkout } = useWorkouts();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotification({
        open: true,
        message: 'Please log in to view and start workouts',
        severity: 'warning'
      });
      navigate('/auth');
      return;
    }

    const initializeRoutine = async () => {
      try {
        setLoading(true);
        await Promise.all([loadRoutine(), checkActiveWorkout()]);
      } catch (error) {
        console.error('Error initializing routine:', error);
        setNotification({
          open: true,
          message: `Error loading routine: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeRoutine();
  }, [routineId, currentUser]);

  const loadRoutine = async () => {
    try {
      const routines = await getUserRoutines();
      const currentRoutine = routines.find(r => r.id === routineId);
      
      if (!currentRoutine) {
        setNotification({
          open: true,
          message: 'Routine not found',
          severity: 'error'
        });
        navigate('/routines');
        return;
      }
      
      console.log('Loaded routine:', currentRoutine);
      setRoutine(currentRoutine);
    } catch (error) {
      console.error('Error loading routine:', error);
      throw error;
    }
  };

  const checkActiveWorkout = async () => {
    try {
      const workout = await getActiveWorkout();
      console.log('Active workout:', workout);
      setActiveWorkout(workout);
      return workout;
    } catch (error) {
      console.error('Error checking active workout:', error);
      throw error;
    }
  };

  const handleDeleteExercise = async (exerciseId, xpPerSet) => {
    if (window.confirm('Are you sure you want to remove this exercise?')) {
      await removeExerciseFromRoutine(routineId, exerciseId, xpPerSet);
      await loadRoutine();
    }
  };

  const handleStartWorkout = async () => {
    if (!currentUser) {
      setNotification({
        open: true,
        message: 'Please log in to start a workout',
        severity: 'warning'
      });
      navigate('/auth');
      return;
    }

    // Instead of showing a dialog, directly handle the workout transition
    await handleWorkoutTransition();
  };

  const handleWorkoutTransition = async () => {
    try {
      setStartingWorkout(true);
      
      // First check if there's an active workout
      const activeWorkoutCheck = await getActiveWorkout();
      
      if (activeWorkoutCheck) {
        console.log(`Found active workout to terminate: ${activeWorkoutCheck.id}`);
        
        // Try to terminate the workout directly
        const terminated = await terminateWorkout(activeWorkoutCheck.id);
        
        if (!terminated) {
          console.log('Standard termination failed, trying emergency cleanup');
          
          // Emergency cleanup - direct database operations
          try {
            // 1. Get all workout exercises
            const { data: exercises } = await supabase
              .from('workout_exercises')
              .select('id')
              .eq('workout_session_id', activeWorkoutCheck.id);
              
            if (exercises && exercises.length > 0) {
              // 2. Delete all workout sets
              for (const exercise of exercises) {
                await supabase
                  .from('workout_sets')
                  .delete()
                  .eq('workout_exercise_id', exercise.id);
              }
              
              // 3. Delete all workout exercises
              await supabase
                .from('workout_exercises')
                .delete()
                .eq('workout_session_id', activeWorkoutCheck.id);
            }
            
            // 4. Delete the workout session
            await supabase
              .from('workout_sessions')
              .delete()
              .eq('id', activeWorkoutCheck.id);
              
            console.log('Emergency cleanup completed');
          } catch (emergencyError) {
            console.error('Emergency cleanup failed:', emergencyError);
            setNotification({
              open: true,
              message: 'Could not clean up previous workout. Please try again later.',
              severity: 'error'
            });
            setStartingWorkout(false);
            return;
          }
        }
        
        // Reset active workout state
        setActiveWorkout(null);
      }
      
      // Start a new workout regardless of what happened before
      console.log('Proceeding to start new workout');
      await startNewWorkout();
      
    } catch (error) {
      console.error('Error handling workout transition:', error);
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setStartingWorkout(false);
    }
  };

  const startNewWorkout = async () => {
    try {
      if (!routine || !routine.routine_exercises || routine.routine_exercises.length === 0) {
        setNotification({
          open: true,
          message: 'Cannot start workout: This routine has no exercises',
          severity: 'error'
        });
        return;
      }

      console.log('Starting new workout with routine:', routine);
      
      const workout = await startWorkout(routineId, routine.routine_exercises);
      console.log('Workout created:', workout);

      if (!workout) {
        throw new Error('Failed to create workout session');
      }

      navigate(`/workout-session/${workout.id}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setNotification({
        open: true,
        message: `Error starting workout: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!routine) {
    return null;
  }

  return (
    <>
      <div className="routine-detail-background"></div>
      <Box className="routine-detail-container">
        <Box className="routine-detail-header">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/routines')}
            className="back-button"
          >
            Back to Routines
          </Button>
          <Typography variant="h2" className="routine-title">
            {routine.name}
          </Typography>
          <Typography variant="subtitle1" className="routine-total-xp">
            Total XP: {routine.total_xp}
          </Typography>
          
          {routine.routine_exercises?.length > 0 && (
            <Button
              variant="contained"
              className="start-workout-button"
              startIcon={<FitnessCenterIcon />}
              onClick={handleStartWorkout}
              disabled={startingWorkout}
            >
              {startingWorkout ? <CircularProgress size={24} /> : 'Start Workout'}
            </Button>
          )}
        </Box>

        <List className="exercises-list">
          {routine.routine_exercises?.map((exercise) => (
            <ListItem key={exercise.id} className="exercise-item">
              <ListItemText
                primary={exercise.exercise.name}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {`${exercise.sets} sets × ${exercise.reps} reps • ${exercise.xp_per_set} XP`}
                    </Typography>
                    <Typography component="span" variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {`${exercise.exercise.target} • ${exercise.exercise.equipment} • Base XP: ${calculateExerciseXP(exercise.exercise)}`}
                    </Typography>
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleDeleteExercise(exercise.id, exercise.xp_per_set)}
                  className="delete-exercise-button"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {!routine.routine_exercises?.length && (
          <Typography className="empty-routine">
            No exercises added yet. Add exercises from the workouts page.
          </Typography>
        )}
        
        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default RoutineDetail; 