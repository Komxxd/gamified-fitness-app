import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext';
import { 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Badge
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { supabase } from '../supabase';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount();
      subscribeToNotifications();
    }
  }, [currentUser]);

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`
      }, () => {
        loadUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    setConfirmLogout(true);
  };

  const confirmLogoutAction = async () => {
    try {
      await logout();
      setConfirmLogout(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleMyRoutines = () => {
    navigate('/routines');
    handleClose();
  };

  const handleWorkoutHistory = () => {
    navigate('/workout-history');
    handleClose();
  };

  const handleChallenges = () => {
    navigate('/challenges');
    handleClose();
  };

  const handleNotifications = () => {
    navigate('/notifications');
    handleClose();
  };

  return (
    <AppBar position="sticky" className="navbar">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" className="navbar-brand">
          FitArena
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box className="nav-links">
          {!currentUser && (
            <Button component={Link} to="/" className="nav-link">
              Home
            </Button>
          )}
          <Button component={Link} to="/workouts" className="nav-link">
            Workouts
          </Button>
          <Button component={Link} to="/leaderboard" className="nav-link">
            Leaderboard
          </Button>
          <Button component={Link} to="/challenges" className="nav-link">
            Challenges
          </Button>
          {currentUser && (
            <Button component={Link} to="/community" className="nav-link">
              Community
            </Button>
          )}
          {currentUser ? (
            <>
              <IconButton
                onClick={handleMenu}
                className="profile-button"
                size="large"
              >
                <AccountCircleIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleProfile}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  Account
                </MenuItem>
                <MenuItem onClick={handleMyRoutines}>
                  <FitnessCenterIcon fontSize="small" sx={{ mr: 1 }} />
                  My Routines
                </MenuItem>
                <MenuItem onClick={handleWorkoutHistory}>
                  <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                  Workout History
                </MenuItem>
                <MenuItem onClick={handleChallenges}>
                  <EmojiEventsIcon fontSize="small" sx={{ mr: 1 }} />
                  Challenges
                </MenuItem>
                <MenuItem onClick={handleNotifications}>
                  <NotificationsIcon fontSize="small" sx={{ mr: 1 }} />
                  Notifications
                  {unreadCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        backgroundColor: 'error.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      {unreadCount}
                    </Box>
                  )}
                </MenuItem>
                <MenuItem onClick={handleLogout} className="logout-menu-item">Sign Out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} to="/auth" className="nav-link">
              Sign In / Sign Up
            </Button>
          )}
        </Box>
      </Toolbar>

      <Dialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to log out?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>Cancel</Button>
          <Button onClick={confirmLogoutAction} color="error">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;
