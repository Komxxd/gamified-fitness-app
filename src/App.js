/**
 * Main application component that handles routing and layout.
 * Implements protected routes for authenticated features and public routes for general access.
 * Uses React Suspense for lazy loading and Material-UI for the component library.
 */
import React, { Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

import './App.css';
import ExerciseDetail from './pages/ExerciseDetail';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import UpdatePassword from './pages/UpdatePassword';
import Workouts from './pages/Workouts';
import CategoryExercises from './pages/CategoryExercises';
import Routines from './pages/Routines';
import RoutineDetail from './pages/RoutineDetail';
import WorkoutSession from './pages/WorkoutSession';
import WorkoutHistory from './pages/WorkoutHistory';
import Leaderboard from './pages/Leaderboard';
import Community from './pages/Community';
import Notifications from './pages/Notifications';
import LoadingFallback from './components/LoadingFallback';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';

const App = () => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = React.useState({ open: false, message: '', severity: 'info' });

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Navbar />
      {/* Wrap routes in Suspense for code splitting and lazy loading */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={currentUser ? <Navigate to="/workouts" /> : <Home />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/exercises/:type/:category" element={<CategoryExercises />} />
          <Route path="/exercise/:id" element={<ExerciseDetail />} />
          <Route path="/auth" element={currentUser ? <Navigate to="/workouts" /> : <Auth />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/:challengeType/:challengeId" element={<ChallengeDetail />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/update-password" element={currentUser ? <UpdatePassword /> : <Navigate to="/auth" />} />
          <Route path="/routines" element={currentUser ? <Routines /> : <Navigate to="/auth" />} />
          <Route path="/routines/:routineId" element={currentUser ? <RoutineDetail /> : <Navigate to="/auth" />} />
          <Route path="/workout-session/:sessionId" element={currentUser ? <WorkoutSession /> : <Navigate to="/auth" />} />
          <Route path="/workout-history" element={currentUser ? <WorkoutHistory /> : <Navigate to="/auth" />} />
          <Route path="/community" element={currentUser ? <Community /> : <Navigate to="/auth" />} />
          <Route path="/notifications" element={currentUser ? <Notifications /> : <Navigate to="/auth" />} />
        </Routes>
      </Suspense>
      <Footer />
      
      {/* Global notification system */}
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
  );
};

export default App;