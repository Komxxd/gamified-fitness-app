/**
 * RoutineDialog Component
 * 
 * A modal dialog that allows users to add exercises to their workout routines.
 * Provides functionality to:
 * - Select an existing routine
 * - Create a new routine
 * - Specify sets and reps for the exercise
 * - Add the exercise to the selected routine
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controls dialog visibility
 * @param {Function} props.onClose - Handler for dialog close
 * @param {Object} props.exercise - Exercise to be added to routine
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useRoutines } from '../hooks/useRoutines';

const RoutineDialog = ({ open, onClose, exercise }) => {
  // State management
  const [routines, setRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [creating, setCreating] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showNewRoutineForm, setShowNewRoutineForm] = useState(false);
  
  // Custom hook for routine operations
  const { getUserRoutines, createRoutine, addExerciseToRoutine, loading, error } = useRoutines();

  // Load user's routines when dialog opens
  useEffect(() => {
    if (open) {
      loadRoutines();
    }
  }, [open]);

  /**
   * Fetches user's routines from the database
   * Updates local state with the fetched routines
   */
  const loadRoutines = async () => {
    const userRoutines = await getUserRoutines();
    setRoutines(userRoutines || []);
  };

  /**
   * Creates a new routine with the specified name
   * Automatically selects the new routine after creation
   */
  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) return;

    setCreating(true);
    const newRoutine = await createRoutine({
      name: newRoutineName,
      description: '',
      total_xp: 0
    });

    if (newRoutine) {
      setSelectedRoutine(newRoutine.id);
      setShowNewRoutineForm(false);
      await loadRoutines();
    }
    setCreating(false);
  };

  /**
   * Adds the current exercise to the selected routine
   * Includes exercise details, sets, reps, and ordering information
   */
  const handleAddToRoutine = async () => {
    if (!selectedRoutine || !exercise) return;

    const exerciseData = {
      exercise_id: exercise.id,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        gifUrl: exercise.gifUrl,
        target: exercise.target,
        equipment: exercise.equipment,
        bodyPart: exercise.bodyPart
      },
      sets,
      reps,
      order_index: 0 // Will be updated when ordering is implemented
    };

    const result = await addExerciseToRoutine(selectedRoutine, exerciseData);
    if (result) {
      onClose();
    }
  };

  /**
   * Resets dialog state and closes it
   */
  const handleClose = () => {
    setSelectedRoutine('');
    setNewRoutineName('');
    setShowNewRoutineForm(false);
    setSets(3);
    setReps(10);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          background: '#1a1b2f',
          color: 'white',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        Add to Routine
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {/* Error Alert */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Exercise Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Exercise: {exercise?.name}
          </Typography>
        </Box>

        {/* New Routine Form */}
        {showNewRoutineForm ? (
          <Box sx={{ mb: 3 }}>
            <TextField
              label="New Routine Name"
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                onClick={handleCreateRoutine} 
                variant="contained" 
                disabled={creating || !newRoutineName.trim()}
              >
                {creating ? <CircularProgress size={24} /> : 'Create Routine'}
              </Button>
              <Button onClick={() => setShowNewRoutineForm(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          /* Routine Selection */
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Routine</InputLabel>
              <Select
                value={selectedRoutine}
                onChange={(e) => setSelectedRoutine(e.target.value)}
                label="Select Routine"
              >
                {routines.map((routine) => (
                  <MenuItem key={routine.id} value={routine.id}>
                    {routine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              onClick={() => setShowNewRoutineForm(true)}
              variant="outlined"
              fullWidth
            >
              Create New Routine
            </Button>
          </Box>
        )}

        {/* Sets and Reps Input */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Sets"
            type="number"
            value={sets}
            onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
            InputProps={{ inputProps: { min: 1 } }}
          />
          <TextField
            label="Reps"
            type="number"
            value={reps}
            onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleAddToRoutine}
          variant="contained"
          disabled={loading || (!selectedRoutine && !showNewRoutineForm)}
        >
          {loading ? <CircularProgress size={24} /> : 'Add to Routine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoutineDialog; 