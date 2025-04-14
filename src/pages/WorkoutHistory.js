import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import useWorkouts from '../hooks/useWorkouts';
import './WorkoutHistory.css';

const WorkoutHistory = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const { getWorkoutHistory } = useWorkouts();

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      setLoading(true);
      const history = await getWorkoutHistory();
      setWorkouts(history || []);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandWorkout = (workoutId) => {
    setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <div className="workout-history-background"></div>
      <Box className="workout-history-container">
        <Box className="workout-history-header">
          <Button
            className="back-button"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/routines')}
          >
            Back to Routines
          </Button>
          
          <Typography variant="h2" className="page-title">
            Workout History
          </Typography>
        </Box>

        {workouts.length === 0 ? (
          <Box className="empty-history">
            <FitnessCenterIcon className="empty-icon" />
            <Typography variant="h5" className="empty-title">
              No Workout History Yet
            </Typography>
            <Typography variant="body1" className="empty-subtitle">
              Complete your first workout to see it here!
            </Typography>
            <Button
              variant="contained"
              className="start-workout-button"
              onClick={() => navigate('/routines')}
            >
              Go to Routines
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {workouts.map((workout) => (
              <Grid item xs={12} key={workout.id}>
                <Card className="workout-card">
                  <CardContent className="workout-card-content">
                    <Box className="workout-card-header">
                      <Box className="workout-card-title-section">
                        <Typography variant="h5" className="workout-title">
                          Workout Session
                        </Typography>
                        <Box className="workout-meta">
                          <Chip
                            icon={<CalendarTodayIcon />}
                            label={formatDate(workout.start_time)}
                            className="workout-chip date"
                          />
                          <Chip
                            icon={<TimerIcon />}
                            label={calculateDuration(workout.start_time, workout.end_time)}
                            className="workout-chip duration"
                          />
                          <Chip
                            icon={<EmojiEventsIcon />}
                            label={`${workout.total_xp} XP`}
                            className="workout-chip xp"
                          />
                        </Box>
                      </Box>
                      
                      <IconButton
                        onClick={() => handleExpandWorkout(workout.id)}
                        className="expand-button"
                      >
                        {expandedWorkout === workout.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={expandedWorkout === workout.id}>
                      <Box className="workout-details">
                        <Divider className="workout-divider" />
                        
                        <Typography variant="h6" className="exercises-title">
                          Exercises
                        </Typography>
                        
                        <List className="exercises-list">
                          {workout.workout_exercises?.map((exercise) => (
                            <ListItem key={exercise.id} className="exercise-item">
                              <Box className="exercise-content">
                                <Typography className="exercise-name">
                                  {exercise.exercise?.name || 'Unknown Exercise'}
                                </Typography>
                                
                                <Box className="exercise-stats">
                                  <Chip
                                    label={`${exercise.sets_completed} sets`}
                                    size="small"
                                    className="exercise-chip sets"
                                  />
                                  <Chip
                                    label={`${exercise.total_reps_completed} reps`}
                                    size="small"
                                    className="exercise-chip reps"
                                  />
                                  <Chip
                                    label={`${exercise.xp_earned} XP`}
                                    size="small"
                                    className="exercise-chip xp"
                                  />
                                </Box>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                        
                        {workout.notes && (
                          <Box className="workout-notes">
                            <Typography variant="h6" className="notes-title">
                              Notes
                            </Typography>
                            <Typography className="notes-content">
                              {workout.notes}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </>
  );
};

export default WorkoutHistory; 