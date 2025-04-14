import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, TextField, InputAdornment, Grid, Button } from '@mui/material';
import { fetchData, exerciseOptions, searchExercisesByName } from '../utils/fetchData';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import SearchIcon from '@mui/icons-material/Search';
import ExerciseCard from '../components/ExerciseCard';
import CategorySection from '../components/CategorySection';
import RoutineDialog from '../components/RoutineDialog';
import { useAuth } from '../contexts/AuthContext';
import LoadingFallback from '../components/LoadingFallback';
import './Workouts.css';

const Workouts = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
  const [targetMuscles, setTargetMuscles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Icon mapping for equipment
  const equipmentIcons = {
    'body weight': <AccessibilityNewIcon />,
    'dumbbell': <FitnessCenterIcon />,
    'barbell': <LinearScaleIcon />,
    'cable': <AllInclusiveIcon />,
    'leverage machine': <SportsGymnasticsIcon />,
    'band': <AllInclusiveIcon />,
    'smith machine': <FitnessCenterIcon />,
    'kettlebell': <FitnessCenterIcon />,
    default: <FitnessCenterIcon />
  };

  // Icon mapping for body parts
  const bodyPartIcons = {
    'back': <SportsGymnasticsIcon />,
    'cardio': <DirectionsRunIcon />,
    'chest': <AccessibilityNewIcon />,
    'lower arms': <SportsGymnasticsIcon />,
    'lower legs': <DirectionsRunIcon />,
    'neck': <AccessibilityNewIcon />,
    'shoulders': <SportsGymnasticsIcon />,
    'upper arms': <SportsMmaIcon />,
    'upper legs': <EscalatorWarningIcon />,
    'waist': <SelfImprovementIcon />,
    default: <AccessibilityNewIcon />
  };

  // Icon mapping for target muscles
  const targetMuscleIcons = {
    'abs': <SelfImprovementIcon />,
    'biceps': <SportsMmaIcon />,
    'delts': <SportsGymnasticsIcon />,
    'forearms': <SportsMmaIcon />,
    'glutes': <DirectionsRunIcon />,
    'hamstrings': <DirectionsRunIcon />,
    'lats': <SportsGymnasticsIcon />,
    'pectorals': <AccessibilityNewIcon />,
    'quads': <DirectionsRunIcon />,
    'traps': <SportsGymnasticsIcon />,
    'triceps': <SportsMmaIcon />,
    default: <SportsGymnasticsIcon />
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const equipmentList = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises/equipmentList',
          exerciseOptions
        );
        console.log('Equipment list:', equipmentList);
        
        const bodyPartsList = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises/bodyPartList',
          exerciseOptions
        );
        console.log('Body parts list:', bodyPartsList);
        
        const targetList = await fetchData(
          'https://exercisedb.p.rapidapi.com/exercises/targetList',
          exerciseOptions
        );
        console.log('Target list:', targetList);

        if (Array.isArray(equipmentList)) setEquipment(equipmentList);
        if (Array.isArray(bodyPartsList)) setBodyParts(bodyPartsList);
        if (Array.isArray(targetList)) setTargetMuscles(targetList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = async (e) => {
    if (searchTerm.trim()) {
      setSearching(true);
      try {
        const results = await searchExercisesByName(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching exercises:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getIcon = (type, item) => {
    const iconMap = {
      equipment: equipmentIcons,
      bodyPart: bodyPartIcons,
      target: targetMuscleIcons
    };
    
    const icons = iconMap[type] || {};
    return icons[item.toLowerCase()] || icons.default;
  };

  const handleCategoryClick = (type, category) => {
    navigate(`/exercises/${type}/${category}`);
  };

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

  if (loading) {
    return (
      <Box className="workouts-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="workouts-container">
      <div className="animated-bg" />
      <div className="workouts-content">
        <div className="search-container">
          <div className="search-input-wrapper">
            <TextField
              className="search-input"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              className="search-button"
              onClick={handleSearch}
              disabled={!searchTerm.trim() || searching}
              startIcon={searching ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {searchResults.length > 0 ? (
          <div className="results-container">
            <Typography variant="h2" className="section-title">
              Search Results
            </Typography>
            <Grid container spacing={3}>
              {searchResults.map((exercise) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={exercise.id}>
                  <ExerciseCard
                    exercise={exercise}
                    onClick={() => handleExerciseClick(exercise)}
                    onAddToRoutine={() => handleAddToRoutine(exercise)}
                  />
                </Grid>
              ))}
            </Grid>
          </div>
        ) : searchTerm && !searching ? (
          <div className="no-results">
            <Typography variant="h6">
              No exercises found. Try a different search term.
            </Typography>
          </div>
        ) : (
          <div className="categories-wrapper">
            <CategorySection
              title="Train by Equipment"
              items={equipment}
              type="equipment"
              onCategoryClick={handleCategoryClick}
              getIcon={getIcon}
            />
            <CategorySection
              title="Target Specific Muscles"
              items={targetMuscles}
              type="target"
              onCategoryClick={handleCategoryClick}
              getIcon={getIcon}
            />
            <CategorySection
              title="Browse by Body Part"
              items={bodyParts}
              type="bodyPart"
              onCategoryClick={handleCategoryClick}
              getIcon={getIcon}
            />
          </div>
        )}
      </div>

      <RoutineDialog
        open={routineDialogOpen}
        onClose={() => setRoutineDialogOpen(false)}
        exercise={selectedExercise}
        onAddToRoutine={handleAddExerciseToRoutine}
      />
    </Box>
  );
};

export default Workouts; 