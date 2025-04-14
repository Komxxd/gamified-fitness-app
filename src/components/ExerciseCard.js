/**
 * ExerciseCard Component
 * 
 * A reusable card component that displays exercise information in a consistent format.
 * Used throughout the application to show exercise details with optional interaction capabilities.
 * 
 * @param {Object} exercise - The exercise data to display
 * @param {Function} onClick - Handler for when the card is clicked
 * @param {Function} onAddToRoutine - Optional handler for adding the exercise to a routine
 */
import React from 'react';
import { Card, CardContent, CardMedia, Typography, Chip, Box, IconButton } from '@mui/material';
import { calculateExerciseXP } from '../utils/xpSystem';
import AddIcon from '@mui/icons-material/Add';
import './ExerciseCard.css';

const ExerciseCard = ({ exercise, onClick, onAddToRoutine }) => {
  // Safety check for required data
  if (!exercise || !exercise.id) {
    return null;
  }

  // Calculate experience points for the exercise
  const xpValue = calculateExerciseXP(exercise);

  // Fallback image for exercises without gifs
  const defaultImage = 'https://via.placeholder.com/400x400?text=No+Image';

  /**
   * Handles the add to routine button click
   * Prevents the click event from bubbling up to the card's onClick handler
   */
  const handleAddClick = (e) => {
    e.stopPropagation();
    if (typeof onAddToRoutine === 'function') {
      onAddToRoutine(exercise);
    }
  };

  return (
    <Card 
      onClick={() => onClick(exercise)}
      className="exercise-card"
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        }
      }}
    >
      {/* Exercise Image/Animation */}
      <CardMedia
        component="img"
        image={exercise.gifUrl || defaultImage}
        alt={exercise.name}
        loading="lazy"
        sx={{ height: 200, objectFit: 'cover' }}
      />
      
      <CardContent>
        {/* Exercise Title and Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
            {exercise.name}
          </Typography>
          {onAddToRoutine && (
            <IconButton 
              onClick={handleAddClick}
              size="small"
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>

        {/* Exercise Metadata Tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip 
            label={`Target: ${exercise.target}`}
            size="small"
            color="primary"
          />
          <Chip 
            label={`Equipment: ${exercise.equipment}`}
            size="small"
            color="secondary"
          />
          <Chip 
            label={`XP: ${xpValue}`}
            size="small"
            color="success"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;