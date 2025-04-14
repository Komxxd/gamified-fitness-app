import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchData, exerciseOptions } from '../utils/fetchData';
import ExerciseCard from '../components/ExerciseCard';
import RoutineDialog from '../components/RoutineDialog';
import { useAuth } from '../contexts/AuthContext';
import LoadingFallback from '../components/LoadingFallback';
import './CategoryExercises.css';

const CategoryExercises = () => {
  const { type, category } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        let endpoint;
        switch (type) {
          case 'equipment':
            endpoint = `https://exercisedb.p.rapidapi.com/exercises/equipment/${category}`;
            break;
          case 'target':
            endpoint = `https://exercisedb.p.rapidapi.com/exercises/target/${category}`;
            break;
          case 'bodyPart':
            endpoint = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${category}`;
            break;
          default:
            throw new Error('Invalid category type');
        }

        const data = await fetchData(endpoint, exerciseOptions);
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [type, category]);

  const handleExerciseClick = (exercise) => {
    navigate(`/exercise/${exercise.id}`, { state: { exercise } });
  };

  const handleAddToRoutine = (exercise) => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setSelectedExercise(exercise);
    setRoutineDialogOpen(true);
  };

  const handleAddExerciseToRoutine = (exerciseWithSetsReps, routineName) => {
    if (!currentUser) return;
    
    const savedRoutines = JSON.parse(localStorage.getItem(`routines_${currentUser.uid}`)) || [];
    
    let routineIndex = savedRoutines.findIndex(r => r.name === routineName);
    if (routineIndex === -1) {
      // Create new routine if it doesn't exist
      savedRoutines.push({
        id: Date.now().toString(),
        name: routineName,
        exercises: [],
        totalXP: 0
      });
      routineIndex = savedRoutines.length - 1;
    }

    // Add exercise to routine
    savedRoutines[routineIndex].exercises.push({
      ...exerciseWithSetsReps,
      id: Date.now().toString()
    });

    // Update total XP
    savedRoutines[routineIndex].totalXP = savedRoutines[routineIndex].exercises.reduce(
      (sum, ex) => sum + (ex.totalXP || 0),
      0
    );

    localStorage.setItem(`routines_${currentUser.uid}`, JSON.stringify(savedRoutines));
    setRoutineDialogOpen(false);
  };

  const getCategoryTitle = () => {
    switch (type) {
      case 'equipment':
        return `Exercises with ${category}`;
      case 'target':
        return `${category} Exercises`;
      case 'bodyPart':
        return `${category} Exercises`;
      default:
        return 'Exercises';
    }
  };

  if (loading) {
    return (
      <Box className="category-exercises-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="category-exercises-container">
      <Box className="category-header">
        <Button
          className="back-button"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/workouts')}
        >
          Back to Categories
        </Button>
        <Typography variant="h2" className="category-title">
          {getCategoryTitle()}
        </Typography>
        <Typography variant="subtitle1" className="exercises-count">
          {exercises.length} exercises found
        </Typography>
      </Box>

      <Grid container spacing={3} className="exercises-grid">
        {exercises.map((exercise) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={exercise.id}>
            <ExerciseCard
              exercise={exercise}
              onClick={() => handleExerciseClick(exercise)}
              onAddToRoutine={() => handleAddToRoutine(exercise)}
            />
          </Grid>
        ))}
      </Grid>

      <RoutineDialog
        open={routineDialogOpen}
        onClose={() => setRoutineDialogOpen(false)}
        exercise={selectedExercise}
        onAddToRoutine={handleAddExerciseToRoutine}
      />
    </Box>
  );
};

export default CategoryExercises; 