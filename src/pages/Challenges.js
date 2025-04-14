import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  LinearProgress,
  Button,
  Tabs,
  Tab,
  IconButton,
  Modal,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import AddIcon from '@mui/icons-material/Add';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import './Challenges.css';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { calculateLevel } from '../utils/xpSystem';

const Challenges = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, syncUserXP } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userChallenges, setUserChallenges] = useState([]);
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  
  // Challenge data based on the tab
  const [challengeData, setChallengeData] = useState({
    weekly: [],
    thirtyDay: {}
  });

  // Add XP tracking and calculation utilities
  const XP_VALUES = {
    weekly: {
      dailyCompletion: 25,
      weeklyBonus: 50  // Bonus for completing all 7 days
    },
    thirtyDay: {
      arms: 150,
      chest: 150,
      legs: 150,
      shoulders: 150,
      fullbody: 180,
      cardio: 150
    }
  };

  // Add state to track user XP
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    // Load challenges and user progress
    loadChallenges();
  }, [currentUser]);

  useEffect(() => {
    // Check if we have a default tab in the navigation state
    if (location.state && location.state.defaultTab !== undefined) {
      setTab(location.state.defaultTab);
    }
  }, [location.state]);

  useEffect(() => {
    // Load user XP from localStorage or Supabase
    const loadUserXP = async () => {
      if (currentUser) {
        try {
          // Sync XP between localStorage and Supabase
          const syncedXP = await syncUserXP();
          setUserXP(syncedXP);
        } catch (error) {
          console.error('Error syncing XP:', error);
          // Fallback to localStorage if sync fails
          const savedXP = localStorage.getItem(`user-xp-${currentUser.id}`);
          if (savedXP) {
            setUserXP(parseInt(savedXP, 10));
          }
        }
      }
    };
    
    loadUserXP();
  }, [currentUser, syncUserXP]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      // Generate mock data
      const mockWeeklyChallenge = generateWeeklyChallenge();
      const mockThirtyDayArmsChallenge = generateThirtyDayChallenge('arms');
      const mockThirtyDayChestChallenge = generateThirtyDayChallenge('chest');
      const mockThirtyDayLegsChallenge = generateThirtyDayChallenge('legs');
      const mockThirtyDayShouldersChallenge = generateThirtyDayChallenge('shoulders');
      const mockThirtyDayFullBodyChallenge = generateThirtyDayChallenge('fullbody');
      const mockThirtyDayCardioChallenge = generateThirtyDayChallenge('cardio');

      // Set the base challenge data
      setChallengeData({
        weekly: mockWeeklyChallenge,
        thirtyDay: {
          arms: mockThirtyDayArmsChallenge,
          chest: mockThirtyDayChestChallenge,
          legs: mockThirtyDayLegsChallenge,
          shoulders: mockThirtyDayShouldersChallenge,
          fullbody: mockThirtyDayFullBodyChallenge,
          cardio: mockThirtyDayCardioChallenge
        }
      });

      // If user is logged in, load their progress from localStorage
      if (currentUser) {
        // Create default progress data
        const defaultProgress = {
          weekly: mockWeeklyChallenge.map(day => ({
            ...day,
            completed: false,
            exercises: day.exercises.map(ex => ({
              ...ex,
              completed: false
            }))
          })),
          thirtyDay: {
            arms: mockThirtyDayArmsChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            })),
            chest: mockThirtyDayChestChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            })),
            legs: mockThirtyDayLegsChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            })),
            shoulders: mockThirtyDayShouldersChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            })),
            fullbody: mockThirtyDayFullBodyChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            })),
            cardio: mockThirtyDayCardioChallenge.map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            }))
          }
        };
        
        // Try to load saved progress from localStorage
        const weeklyStorageKey = `weekly-challenge-${currentUser.id}`;
        
        const savedWeeklyProgress = localStorage.getItem(weeklyStorageKey);
        
        if (savedWeeklyProgress) {
          defaultProgress.weekly = JSON.parse(savedWeeklyProgress);
        }
        
        // For thirty day challenges, we load each type separately
        Object.keys(defaultProgress.thirtyDay).forEach(type => {
          const storageKey = `challenge-thirty-day-${type}-${currentUser.id}`;
          const savedProgress = localStorage.getItem(storageKey);
          if (savedProgress) {
            defaultProgress.thirtyDay[type] = JSON.parse(savedProgress);
          }
        });
        
        setUserChallenges(defaultProgress);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleAccordionChange = (challengeId) => (event, isExpanded) => {
    setExpandedChallenge(isExpanded ? challengeId : null);
  };

  // Update the updateUserXP function to also update the user's level
  const updateUserXP = async (amount) => {
    console.log(`Starting updateUserXP with amount: ${amount}`);
    
    // Update XP in the user's profile in supabase first to avoid race conditions
    if (currentUser) {
      try {
        // First, get the current XP from the profile
        console.log(`Fetching current XP for user ${currentUser.id}`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile XP:', profileError);
          throw profileError;
        }
        
        // Calculate new XP value
        const currentXP = profileData?.xp || 0;
        const newXP = currentXP + amount;
        console.log(`Current XP: ${currentXP}, New XP: ${newXP}`);
        
        // Calculate the new level based on the updated XP
        const { level: newLevel } = calculateLevel(newXP);
        console.log(`New level calculated: ${newLevel}`);
        
        // Update the profile with the new XP and level
        console.log(`Updating profile in Supabase...`);
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ 
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);
        
        if (updateError) {
          console.error('Error updating profile XP:', updateError);
          throw updateError;
        }
        
        console.log(`User XP updated in profile: +${amount} XP (new total: ${newXP}, level: ${newLevel})`);
        
        // Now update local state and localStorage AFTER the database update
        localStorage.setItem(`user-xp-${currentUser.id}`, newXP.toString());
        setUserXP(newXP);
        
        // Show XP notification
        console.log(`Showing XP notification for ${amount} XP`);
        alert(`Congratulations! You earned ${amount} XP!`);
        
        return true;
      } catch (error) {
        console.error('Error updating profile XP:', error);
        return false;
      }
    } else {
      // For users not logged in, just update local state
      console.log(`User not logged in, updating only local state: +${amount} XP`);
      setUserXP(prev => prev + amount);
      alert(`Congratulations! You earned ${amount} XP!`);
      return true;
    }
  };

  // Modify handleExerciseComplete to check for day and week completion and award XP
  const handleExerciseComplete = async (dayId, exerciseId, isCompleted, skipXpAward = false) => {
    try {
      console.log(`Exercise completion: dayId=${dayId}, exerciseId=${exerciseId}, isCompleted=${isCompleted}, skipXpAward=${skipXpAward}`);
      
      // Create a variable to store info about the day outside the state update function
      let currentDay = null;
      let previouslyCompleted = false;
      let willBeCompleted = false;
      
      // First, find the relevant day data before updating state
      if (tab === 0) { // Weekly challenges
        const dayIndex = userChallenges.weekly.findIndex(d => d.id === dayId);
        if (dayIndex >= 0) {
          currentDay = userChallenges.weekly[dayIndex];
          previouslyCompleted = currentDay.completed;
          
          // Calculate if all exercises will be completed after this change
          const nextExercises = currentDay.exercises.map(ex => 
            ex.id === exerciseId ? { ...ex, completed: isCompleted } : ex
          );
          willBeCompleted = nextExercises.every(ex => ex.completed);
          
          console.log(`Day ${dayId} - previously completed: ${previouslyCompleted}, will be completed: ${willBeCompleted}`);
        }
      }
      
      // Update the local state
      setUserChallenges(prev => {
        const currentTab = Object.keys(challengeData)[tab];
        const newState = { ...prev };
        
        if (currentTab === 'weekly') {
          // Keep track of previous completion state to check if this completes the day
          const days = [...prev.weekly];
          const dayIndex = days.findIndex(day => day.id === dayId);
          const day = days[dayIndex];
          
          // Only proceed if we found the day
          if (day) {
            // Update the exercise completion status
            const updatedExercises = day.exercises.map(ex => 
              ex.id === exerciseId ? { ...ex, completed: isCompleted } : ex
            );
            
            // Check if all exercises are now completed
            const allCompleted = updatedExercises.every(ex => ex.completed);
            
            // Update the day in our state copy
            newState.weekly = days.map(d => {
              if (d.id === dayId) {
                return {
                  ...d,
                  exercises: updatedExercises,
                  completed: allCompleted
                };
              }
              return d;
            });
            
            // Save to localStorage
            if (currentUser) {
              const storageKey = `weekly-challenge-${currentUser.id}`;
              localStorage.setItem(storageKey, JSON.stringify(newState.weekly));
            }
            
            // Update the selected challenge in real-time for the modal
            if (selectedChallenge && selectedChallenge.id === dayId) {
              setSelectedChallenge({
                ...selectedChallenge,
                exercises: updatedExercises,
                completed: allCompleted
              });
            }
          }
        } else if (currentTab === 'thirtyDay') {
          // For thirty day challenges, we need to know which specific challenge (arms, chest, etc.)
          const selectedType = getSelectedThirtyDayType();
          if (selectedType) {
            // Keep track of completion percentage before update
            const days = [...prev.thirtyDay[selectedType]];
            const totalExercises = days.reduce((sum, day) => sum + day.exercises.length, 0);
            const completedBefore = days.reduce((sum, day) => 
              sum + day.exercises.filter(ex => ex.completed).length, 0);
            const percentBefore = completedBefore / totalExercises;
            
            newState.thirtyDay[selectedType] = days.map(day => {
              if (day.id === dayId) {
                const updatedExercises = day.exercises.map(ex => 
                  ex.id === exerciseId ? { ...ex, completed: isCompleted } : ex
                );
                return {
                  ...day,
                  exercises: updatedExercises,
                  completed: updatedExercises.every(ex => ex.completed)
                };
              }
              return day;
            });
            
            // Calculate completion percentage after update
            const completedAfter = newState.thirtyDay[selectedType].reduce((sum, day) => 
              sum + day.exercises.filter(ex => ex.completed).length, 0);
            const percentAfter = completedAfter / totalExercises;
            
            // Calculate XP earned based on progress
            const totalPossibleXP = XP_VALUES.thirtyDay[selectedType];
            const xpPerPercent = totalPossibleXP / 100;
            
            // Award XP for every 10% milestone reached
            const milestonesBefore = Math.floor(percentBefore * 10);
            const milestonesAfter = Math.floor(percentAfter * 10);
            
            if (milestonesAfter > milestonesBefore) {
              const xpEarned = (milestonesAfter - milestonesBefore) * xpPerPercent * 10;
              updateUserXP(Math.round(xpEarned));
            }
            
            // Save to localStorage
            if (currentUser) {
              const storageKey = `challenge-thirty-day-${selectedType}-${currentUser.id}`;
              localStorage.setItem(storageKey, JSON.stringify(newState.thirtyDay[selectedType]));
            }
            
            // Update the selected challenge in real-time for the modal
            if (selectedChallenge && selectedChallenge.id === dayId) {
              setSelectedChallenge(newState.thirtyDay[selectedType].find(day => day.id === dayId));
            }
          }
        }
        
        return newState;
      });
      
      // Award XP outside of state update to prevent duplicate awards
      // Only award XP if:
      // 1. The day was not previously completed
      // 2. The day will be completed after this change
      // 3. We're marking an exercise as completed (not uncompleting it)
      // 4. skipXpAward is false (not being called from Complete All)
      if (!skipXpAward && !previouslyCompleted && willBeCompleted && isCompleted) {
        console.log(`Day newly completed! Awarding ${XP_VALUES.weekly.dailyCompletion} XP`);
        await updateUserXP(XP_VALUES.weekly.dailyCompletion);
        
        // Check if all days are now completed
        const allDaysCompleted = userChallenges.weekly
          .filter(d => d.id !== dayId)
          .every(d => d.completed);
        
        if (allDaysCompleted) {
          console.log(`All weekly days completed! Awarding bonus ${XP_VALUES.weekly.weeklyBonus} XP`);
          await updateUserXP(XP_VALUES.weekly.weeklyBonus);
        }
      }
      
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const calculateProgress = (challenge) => {
    if (!challenge?.exercises || challenge.exercises.length === 0) return 0;
    const totalExercises = challenge.exercises.length;
    const completedExercises = challenge.exercises.filter(ex => ex.completed).length;
    return (completedExercises / totalExercises) * 100;
  };

  const isDayCompleted = (day) => {
    if (!day.exercises || day.exercises.length === 0) return false;
    return day.exercises.every(ex => ex.completed);
  };

  // Mock data generators
  const generateWeeklyChallenge = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, index) => ({
      id: `weekly-${index + 1}`,
      name: day,
      exercises: [
        {
          id: `w-${index + 1}-ex-1`,
          name: 'Push-ups',
          sets: 3,
          reps: 10,
          completed: false,
          imageUrl: "https://exercisedb.p.rapidapi.com/assets/exercises/0001.gif"
        },
        {
          id: `w-${index + 1}-ex-2`,
          name: 'Sit-ups',
          sets: 3,
          reps: 15,
          completed: false,
          imageUrl: "https://exercisedb.p.rapidapi.com/assets/exercises/0003.gif"
        },
        {
          id: `w-${index + 1}-ex-3`,
          name: 'Squats',
          sets: 3,
          reps: 12,
          completed: false,
          imageUrl: "https://exercisedb.p.rapidapi.com/assets/exercises/0006.gif"
        }
      ]
    }));
  };

  const generateThirtyDayChallenge = (type) => {
    let exercises = [];
    
    switch(type) {
      case 'arms':
        exercises = [
          {name: 'Bicep Curls', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0010.gif'},
          {name: 'Tricep Dips', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0020.gif'},
          {name: 'Shoulder Press', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0030.gif'}
        ];
        break;
      case 'chest':
        exercises = [
          {name: 'Push-ups', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0001.gif'},
          {name: 'Chest Flies', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0040.gif'},
          {name: 'Bench Press', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0050.gif'}
        ];
        break;
      case 'legs':
        exercises = [
          {name: 'Squats', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0006.gif'},
          {name: 'Lunges', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0009.gif'},
          {name: 'Calf Raises', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0060.gif'}
        ];
        break;
      case 'shoulders':
        exercises = [
          {name: 'Shoulder Press', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0030.gif'},
          {name: 'Lateral Raises', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0070.gif'},
          {name: 'Front Raises', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0080.gif'}
        ];
        break;
      case 'fullbody':
        exercises = [
          {name: 'Burpees', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0059.gif'},
          {name: 'Mountain Climbers', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0025.gif'},
          {name: 'Jumping Jacks', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0027.gif'}
        ];
        break;
      case 'cardio':
        exercises = [
          {name: 'Running', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0090.gif'},
          {name: 'Jumping Jacks', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0027.gif'},
          {name: 'Mountain Climbers', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0025.gif'}
        ];
        break;
      default:
        exercises = [
          {name: 'Push-ups', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0001.gif'},
          {name: 'Sit-ups', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0003.gif'},
          {name: 'Squats', imageUrl: 'https://exercisedb.p.rapidapi.com/assets/exercises/0006.gif'}
        ];
    }
    
    return Array.from({ length: 30 }, (_, i) => ({
      id: `thirty-day-${type}-${i + 1}`,
      name: `Day ${i + 1}`,
      exercises: exercises.map((ex, exIndex) => ({
        id: `td-${type}-${i + 1}-ex-${exIndex + 1}`,
        name: ex.name,
        sets: 3,
        reps: 8 + Math.floor(i / 3), // Increasing difficulty
        completed: false,
        imageUrl: ex.imageUrl
      }))
    }));
  };

  const handleOpenModal = (challenge) => {
    setSelectedChallenge(challenge);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Helper function to determine which 30-day challenge type is currently selected
  const getSelectedThirtyDayType = () => {
    // In a real app, you would track which specific 30-day challenge the user is viewing
    return Object.keys(userChallenges.thirtyDay)[0] || 'arms';
  };

  // Add reset functionality for Weekly challenges
  const handleResetWeeklyChallenge = () => {
    if (window.confirm('Are you sure you want to reset the weekly challenge?')) {
      setUserChallenges(prev => {
        const resetProgress = {
          ...prev,
          weekly: prev.weekly.map(day => ({
            ...day,
            completed: false,
            exercises: day.exercises.map(ex => ({
              ...ex,
              completed: false
            }))
          }))
        };
        
        // Save to localStorage
        if (currentUser) {
          const storageKey = `weekly-challenge-${currentUser.id}`;
          localStorage.setItem(storageKey, JSON.stringify(resetProgress.weekly));
        }
        
        return resetProgress;
      });
    }
  };

  // Replace the card click handler with a more explicit function:
  const handleCardClick = (dayId) => {
    setExpandedChallenge(expandedChallenge === dayId ? null : dayId);
  };

  // Add reset functionality for 30-Day challenges
  const handleResetThirtyDayChallenge = (type) => {
    if (window.confirm(`Are you sure you want to reset the 30-Day ${type.charAt(0).toUpperCase() + type.slice(1)} Challenge?`)) {
      setUserChallenges(prev => {
        const resetProgress = {
          ...prev,
          thirtyDay: {
            ...prev.thirtyDay,
            [type]: prev.thirtyDay[type].map(day => ({
              ...day,
              completed: false,
              exercises: day.exercises.map(ex => ({
                ...ex,
                completed: false
              }))
            }))
          }
        };
        
        // Save to localStorage
        if (currentUser) {
          const storageKey = `challenge-thirty-day-${type}-${currentUser.id}`;
          localStorage.setItem(storageKey, JSON.stringify(resetProgress.thirtyDay[type]));
        }
        
        return resetProgress;
      });
    }
  };

  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (tab) {
      case 0: // Weekly Challenges
        return (
          <div className="challenge-container">
            <Typography variant="h5" className="challenge-section-title">
              Weekly Challenges
            </Typography>
            
            <Typography variant="body1" className="challenge-description">
              Complete these exercises every day for a full week to earn bonus XP!
            </Typography>
            
            {/* Card Grid for Desktop */}
            <div className="challenge-grid">
              {userChallenges.weekly && userChallenges.weekly.map((day) => (
                <div 
                  key={day.id} 
                  className={`challenge-day-card ${isDayCompleted(day) ? 'completed' : ''}`}
                  onClick={() => handleCardClick(day.id)}
                >
                  <div className="challenge-card-content">
                    <div className="challenge-card-labels">
                      <span className="challenge-card-label challenge-card-category">Daily</span>
                      <span className="challenge-card-label challenge-card-system">Cardiovascular System</span>
                      <span className="challenge-card-label challenge-card-xp">25 XP</span>
                      
                      {isDayCompleted(day) && (
                        <CheckCircleIcon className="completed-icon-card" />
                      )}
                    </div>
                    
                    <IconButton 
                      className="add-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleOpenModal(day);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                    
                    <Typography className="challenge-card-title">{day.name}</Typography>
                    
                    <Typography className="challenge-card-subtitle">
                      {day.exercises.length} exercises
                    </Typography>
                    
                    <div className="challenge-card-progress">
                      <div className="challenge-card-progress-text">
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">{Math.round(calculateProgress(day))}%</Typography>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress(day)} 
                        className="challenge-progress"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Accordion for Mobile */}
            {userChallenges.weekly && userChallenges.weekly.map((day) => (
              <Accordion 
                key={day.id}
                expanded={expandedChallenge === day.id}
                onChange={handleAccordionChange(day.id)}
                className={`challenge-accordion ${isDayCompleted(day) ? 'completed' : ''}`}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`${day.id}-content`}
                  id={`${day.id}-header`}
                >
                  <div className="challenge-summary">
                    <Typography className="challenge-day">{day.name}</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(day)} 
                      className="challenge-progress"
                    />
                    {isDayCompleted(day) && <CheckCircleIcon className="completed-icon" />}
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <div className="exercise-list">
                    {day.exercises.map((exercise) => (
                      <div key={exercise.id} className="challenge-exercise">
                        <div className="exercise-details">
                          <Typography className="exercise-name">{exercise.name}</Typography>
                          <Typography className="exercise-info">
                            {exercise.sets} sets × {exercise.reps} reps
                          </Typography>
                        </div>
                        <Checkbox
                          checked={exercise.completed || false}
                          onChange={(e) => handleExerciseComplete(day.id, exercise.id, e.target.checked)}
                          className="exercise-checkbox"
                        />
                      </div>
                    ))}
                    <Button 
                      variant="contained" 
                      className="complete-all-btn"
                      onClick={() => {
                        // Mark all exercises as completed
                        console.log(`Complete All button clicked for day: ${day.name}`);
                        
                        // Check if the day was already completed
                        const wasCompleted = isDayCompleted(day);
                        
                        // If it wasn't already completed, we'll award XP after marking exercises
                        if (!wasCompleted) {
                          // First mark all exercises as completed with skipXpAward=true
                          day.exercises.forEach(exercise => {
                            handleExerciseComplete(day.id, exercise.id, true, true);
                          });
                          
                          // Directly award XP for completing the day
                          updateUserXP(XP_VALUES.weekly.dailyCompletion);
                          
                          // Check if all days are now completed to award the weekly bonus
                          const allDaysCompleted = userChallenges.weekly
                            .filter(d => d.id !== day.id)
                            .every(d => d.completed);
                          
                          if (allDaysCompleted) {
                            updateUserXP(XP_VALUES.weekly.weeklyBonus);
                          }
                        } else {
                          // If it was already completed, just mark the exercises without XP
                          day.exercises.forEach(exercise => {
                            handleExerciseComplete(day.id, exercise.id, true, true);
                          });
                        }
                      }}
                    >
                      Complete All
                    </Button>
                  </div>
                </AccordionDetails>
              </Accordion>
            ))}
            
            {/* Add Reset button for Weekly Challenges */}
            <div className="challenge-restart-container">
              <Button 
                variant="contained" 
                className="restart-challenge-btn"
                onClick={handleResetWeeklyChallenge}
              >
                Reset Weekly Challenge
              </Button>
            </div>
            
            {/* Modal for Exercise Details */}
            <Modal
              open={openModal}
              onClose={handleCloseModal}
              aria-labelledby="exercise-modal-title"
              aria-describedby="exercise-modal-description"
              className="challenge-modal"
            >
              <div className="challenge-exercise-modal">
                <Typography variant="h6" id="exercise-modal-title">
                  {selectedChallenge?.name} Exercises
                </Typography>
                
                <div className="modal-exercise-list">
                  {selectedChallenge?.exercises.map((exercise) => (
                    <div key={exercise.id} className="modal-exercise-item">
                      <div>
                        <Typography variant="body1">{exercise.name}</Typography>
                        <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {exercise.duration ? 
                            exercise.duration : 
                            `${exercise.sets} sets × ${exercise.reps} reps`
                          }
                        </Typography>
                      </div>
                      <Checkbox
                        checked={exercise.completed || false}
                        onChange={(e) => {
                          handleExerciseComplete(selectedChallenge.id, exercise.id, e.target.checked);
                        }}
                        className="exercise-checkbox"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="modal-action-buttons">
                  <Button 
                    variant="contained" 
                    className="complete-all-btn"
                    onClick={() => {
                      if (selectedChallenge && selectedChallenge.exercises) {
                        console.log(`Modal Complete All button clicked for day: ${selectedChallenge.name}`);
                        
                        // Check if the day was already completed
                        const wasCompleted = selectedChallenge.exercises.every(ex => ex.completed);
                        
                        // If it wasn't already completed, we'll award XP after marking exercises
                        if (!wasCompleted) {
                          // First mark all exercises as completed with skipXpAward=true
                          selectedChallenge.exercises.forEach(exercise => {
                            handleExerciseComplete(selectedChallenge.id, exercise.id, true, true);
                          });
                          
                          // Directly award XP for completing the day
                          updateUserXP(XP_VALUES.weekly.dailyCompletion);
                          
                          // Check if all days are now completed to award the weekly bonus
                          const allDaysCompleted = userChallenges.weekly
                            .filter(d => d.id !== selectedChallenge.id)
                            .every(d => d.completed);
                          
                          if (allDaysCompleted) {
                            updateUserXP(XP_VALUES.weekly.weeklyBonus);
                          }
                        } else {
                          // If it was already completed, just mark the exercises without XP
                          selectedChallenge.exercises.forEach(exercise => {
                            handleExerciseComplete(selectedChallenge.id, exercise.id, true, true);
                          });
                        }
                      }
                      handleCloseModal();
                    }}
                  >
                    Complete All
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    className="close-btn"
                    onClick={handleCloseModal}
                  >
                    CLOSE
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        );
        
      case 1: // 30-Day Challenges
        return (
          <div className="challenge-container">
            <Typography variant="h5" className="challenge-section-title">
              30-Day Challenges
            </Typography>
            
            <Typography variant="body1" className="challenge-description">
              Choose a 30-day challenge to transform your body and build strength!
            </Typography>
            
            <div className="category-challenge-grid">
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <FitnessCenterIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Arms Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Build stronger, more defined arms with this 30-day program. Earn up to 150 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/arms')}
                >
                  View Challenge
                </Button>
              </div>
              
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <SportsGymnasticsIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Chest Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Sculpt your pecs with progressive chest workouts. Earn up to 150 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/chest')}
                >
                  View Challenge
                </Button>
              </div>
              
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <TransferWithinAStationIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Legs Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Build lower body strength and endurance with focused leg exercises. Earn up to 150 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/legs')}
                >
                  View Challenge
                </Button>
              </div>
              
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <FitnessCenterIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Shoulders Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Develop broader shoulders and improved upper body definition. Earn up to 150 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/shoulders')}
                >
                  View Challenge
                </Button>
              </div>
              
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <SportsGymnasticsIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Full Body Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Total body transformation with compound exercises targeting multiple muscle groups. Earn up to 180 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/fullbody')}
                >
                  View Challenge
                </Button>
              </div>
              
              <div className="challenge-category-card">
                <div className="challenge-card-header">
                  <DirectionsRunIcon className="challenge-icon" />
                  <Typography variant="h6">30-Day Cardio Challenge</Typography>
                </div>
                
                <Typography variant="body2" className="challenge-card-description">
                  Improve cardiovascular health and endurance with progressive cardio workouts. Earn up to 150 XP!
                </Typography>
                
                <Button 
                  variant="contained" 
                  className="view-challenge-btn"
                  onClick={() => navigate('/challenges/thirty-day/cardio')}
                >
                  View Challenge
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box className="challenges-container">
      <div className="animated-bg" />
      <div className="challenges-content">
        <div className="header-container">
          <div>
            <Typography variant="h4" className="page-title">
              Fitness Challenges
            </Typography>
            
            <Typography variant="body1" className="challenge-count">
              {challengeData.weekly.length + 
                Object.keys(challengeData.thirtyDay).length} challenges found
            </Typography>
          </div>
          
          <div className="user-xp-display">
            <Typography variant="h6" className="xp-text">
              <EmojiEventsIcon className="xp-icon" /> {userXP} XP
            </Typography>
          </div>
        </div>
        
        <Tabs
          value={tab}
          onChange={handleTabChange}
          className="challenge-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Weekly" icon={<AccessTimeIcon />} iconPosition="start" />
          <Tab label="30-Day" icon={<FitnessCenterIcon />} iconPosition="start" />
        </Tabs>
        
        {loading ? (
          <Box className="loading-container">
            <LinearProgress />
          </Box>
        ) : (
          renderTabContent()
        )}
      </div>
    </Box>
  );
};

export default Challenges; 