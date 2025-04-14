import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../contexts/AuthContext';
import { useRoutines } from '../hooks/useRoutines';
import './Routines.css';

const Routines = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [creating, setCreating] = useState(false);
  const { getUserRoutines, createRoutine, deleteRoutine } = useRoutines();

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    loadRoutines();
  }, [currentUser, navigate]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const userRoutines = await getUserRoutines();
      setRoutines(userRoutines || []);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) return;

    try {
      setCreating(true);
      await createRoutine({
        name: newRoutineName,
        description: '',
        total_xp: 0
      });
      setOpenDialog(false);
      setNewRoutineName('');
      await loadRoutines();
    } catch (error) {
      console.error('Error creating routine:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoutine = async (e, routineId) => {
    e.stopPropagation(); // Prevent card click
    if (window.confirm('Are you sure you want to delete this routine?')) {
      await deleteRoutine(routineId);
      await loadRoutines();
    }
  };

  const handleRoutineClick = (routineId) => {
    navigate(`/routines/${routineId}`);
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
      <div className="routines-page-background"></div>
      <Box className="routines-container">
        <Box className="routines-header">
          <Typography variant="h2" className="page-title">
            My Routines
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            className="create-routine-button"
          >
            Create New Routine
          </Button>
        </Box>

        <Grid container spacing={3}>
          {routines.map((routine) => (
            <Grid item xs={12} sm={6} md={4} key={routine.id}>
              <Card 
                className="routine-card"
                onClick={() => handleRoutineClick(routine.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" className="routine-name">
                        {routine.name}
                      </Typography>
                      <Typography variant="subtitle2" className="routine-xp">
                        Total XP: {routine.total_xp}
                      </Typography>
                      <Typography variant="body2" className="exercise-count">
                        {routine.routine_exercises?.length || 0} exercises
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        onClick={(e) => handleDeleteRoutine(e, routine.id)}
                        className="delete-routine-button"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <ArrowForwardIcon className="arrow-icon" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {routines.length === 0 && (
            <Grid item xs={12}>
              <Typography className="no-routines">
                You haven't created any routines yet. Click the button above to create your first routine!
              </Typography>
            </Grid>
          )}
        </Grid>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          PaperProps={{
            sx: {
              background: '#1a1b2f',
              color: 'white',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <DialogTitle>Create New Routine</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Routine Name"
              fullWidth
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateRoutine}
              variant="contained"
              disabled={creating || !newRoutineName.trim()}
            >
              {creating ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default Routines; 