import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '@mui/material/Pagination';
import { Box, Stack, Typography } from '@mui/material';
import { exerciseOptions, fetchData } from '../utils/fetchData';
import ExerciseCard from './ExerciseCard';
import Loader from './Loader';
import RoutineDialog from './RoutineDialog';
import { useAuth } from '../contexts/AuthContext';

const Exercises = ({ exercises, setExercises, bodyPart }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [exercisesPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Only fetch on initial load or when bodyPart changes
    // Don't fetch if exercises were set by search
    if ((initialLoad || bodyPart !== 'all') && exercises.length === 0) {
      const fetchExercisesData = async () => {
        setLoading(true);
        setError('');
        let exercisesData = [];

        try {
          console.log('Fetching exercises for bodyPart:', bodyPart);
          if (bodyPart === 'all') {
            exercisesData = await fetchData('https://exercisedb.p.rapidapi.com/exercises', exerciseOptions);
          } else {
            exercisesData = await fetchData(`https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`, exerciseOptions);
          }
          
          // Ensure exercisesData is an array
          if (!Array.isArray(exercisesData)) {
            console.error('API did not return an array:', exercisesData);
            exercisesData = [];
            setError('Failed to load exercises. Please try again later.');
          } else {
            console.log(`Successfully loaded ${exercisesData.length} exercises for bodyPart: ${bodyPart}`);
          }
          
          setExercises(exercisesData);
          setInitialLoad(false);
        } catch (error) {
          console.error('Error fetching exercises:', error);
          setError('An error occurred while fetching exercises. Please try again later.');
          setExercises([]);
        } finally {
          setLoading(false);
        }
      };

      fetchExercisesData();
    } else {
      // If exercises already exist, just update loading state
      setLoading(false);
    }
  }, [bodyPart, setExercises, exercises.length, initialLoad]);

  // Reset to first page when exercises change
  useEffect(() => {
    setCurrentPage(1);
  }, [exercises]);

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

  // Ensure exercises is an array before using slice
  const exercisesArray = Array.isArray(exercises) ? exercises : [];
  
  // Pagination
  const indexOfLastExercise = currentPage * exercisesPerPage;
  const indexOfFirstExercise = indexOfLastExercise - exercisesPerPage;
  const currentExercises = exercisesArray.slice(indexOfFirstExercise, indexOfLastExercise);

  const paginate = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 1800, behavior: 'smooth' });
  };

  if (loading) return <Loader />;
  
  if (error) {
    return (
      <Box sx={{ mt: '50px', textAlign: 'center' }}>
        <Typography variant="h5" color="error">{error}</Typography>
      </Box>
    );
  }

  if (!currentExercises?.length) {
    return (
      <Box sx={{ mt: '50px', textAlign: 'center' }}>
        <Typography variant="h5">No exercises found. Try a different search or category.</Typography>
      </Box>
    );
  }

  return (
    <Box id="exercises" sx={{ mt: { lg: '109px' } }} mt="50px" p="20px">
      <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { lg: '44px', xs: '30px' } }} mb="46px">
        Showing Results ({exercisesArray.length})
      </Typography>
      <Stack direction="row" sx={{ gap: { lg: '107px', xs: '50px' } }} flexWrap="wrap" justifyContent="center">
        {currentExercises.map((exercise, idx) => (
          <ExerciseCard 
            key={`${exercise.id}-${idx}`} 
            exercise={exercise}
            onClick={() => handleExerciseClick(exercise)}
            onAddToRoutine={() => handleAddToRoutine(exercise)}
          />
        ))}
      </Stack>
      <Stack sx={{ mt: { lg: '114px', xs: '70px' } }} alignItems="center">
        {exercisesArray.length > exercisesPerPage && (
          <Pagination
            color="standard"
            shape="rounded"
            defaultPage={1}
            count={Math.ceil(exercisesArray.length / exercisesPerPage)}
            page={currentPage}
            onChange={paginate}
            size="large"
          />
        )}
      </Stack>

      <RoutineDialog
        open={routineDialogOpen}
        onClose={() => setRoutineDialogOpen(false)}
        exercise={selectedExercise}
        onAddToRoutine={handleAddExerciseToRoutine}
      />
    </Box>
  );
};

export default Exercises;
