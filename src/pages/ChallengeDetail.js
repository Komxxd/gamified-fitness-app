import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Checkbox,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from '../contexts/AuthContext';
import './ChallengeDetail.css';
import { supabase } from '../supabase';
import { calculateLevel } from '../utils/xpSystem';

const ChallengeDetail = () => {
  const { challengeType, challengeId } = useParams();
  const navigate = useNavigate();
  const { currentUser, syncUserXP } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [userXP, setUserXP] = useState(0);

  const XP_VALUES = {
    'thirty-day': {
      arms: 150,
      chest: 150,
      legs: 150,
      shoulders: 150,
      fullbody: 180,
      cardio: 150
    },
    weekly: 175 // 25 XP per day + 50 bonus
  };

  useEffect(() => {
    // Load challenge and user progress
    loadChallengeData();
  }, [challengeType, challengeId]);

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

  const loadChallengeData = async () => {
    setLoading(true);
    try {
      // Determine which challenge to show based on params
      let challengeData;
      let title = '';
      let description = '';
      let icon = null;
      
      if (challengeType === 'thirty-day') {
        if (challengeId === 'arms') {
          challengeData = generateThirtyDayChallenge('arms');
          title = '30-Day Arms Challenge';
          description = 'Build stronger, more defined arms with this progressive 30-day program.';
          icon = <FitnessCenterIcon className="challenge-detail-icon" />;
        } else if (challengeId === 'chest') {
          challengeData = generateThirtyDayChallenge('chest');
          title = '30-Day Chest Challenge';
          description = 'Sculpt your chest with this progressive 30-day program.';
          icon = <SportsGymnasticsIcon className="challenge-detail-icon" />;
        } else if (challengeId === 'legs') {
          challengeData = generateThirtyDayChallenge('legs');
          title = '30-Day Legs Challenge';
          description = 'Build lower body strength and endurance with focused leg exercises.';
          icon = <TransferWithinAStationIcon className="challenge-detail-icon" />;
        } else if (challengeId === 'shoulders') {
          challengeData = generateThirtyDayChallenge('shoulders');
          title = '30-Day Shoulders Challenge';
          description = 'Develop broader shoulders and improved upper body definition.';
          icon = <FitnessCenterIcon className="challenge-detail-icon" />;
        } else if (challengeId === 'fullbody') {
          challengeData = generateThirtyDayChallenge('fullbody');
          title = '30-Day Full Body Challenge';
          description = 'Total body transformation with compound exercises targeting multiple muscle groups.';
          icon = <SportsGymnasticsIcon className="challenge-detail-icon" />;
        } else if (challengeId === 'cardio') {
          challengeData = generateThirtyDayChallenge('cardio');
          title = '30-Day Cardio Challenge';
          description = 'Improve cardiovascular health and endurance with progressive cardio workouts.';
          icon = <DirectionsRunIcon className="challenge-detail-icon" />;
        }
      }
      
      // Set challenge data
      setChallenge({
        id: `${challengeType}-${challengeId}`,
        title,
        description,
        icon,
        days: challengeData
      });
      
      // If user is logged in, load their progress from localStorage first
      if (currentUser) {
        const storageKey = `challenge-${challengeType}-${challengeId}-${currentUser.id}`;
        const savedProgress = localStorage.getItem(storageKey);
        
        if (savedProgress) {
          // Use saved progress from localStorage
          const parsedProgress = JSON.parse(savedProgress);
          setUserProgress(parsedProgress);
          
          // Set first incomplete day as expanded
          const firstIncompleteDay = parsedProgress.findIndex(day => 
            !isDayCompleted(day)
          );
          
          if (firstIncompleteDay !== -1) {
            setExpandedDay(parsedProgress[firstIncompleteDay].id);
          } else {
            setExpandedDay(parsedProgress[0].id);
          }
        } else {
          // No saved progress, use default with all exercises uncompleted
          const defaultProgress = challengeData.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({
              ...ex,
              completed: false
            }))
          }));
          
          setUserProgress(defaultProgress);
          setExpandedDay(defaultProgress[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (dayId) => (event, isExpanded) => {
    setExpandedDay(isExpanded ? dayId : null);
  };

  const handleExerciseComplete = (dayId, exerciseId, isCompleted) => {
    // Create a copy of the current progress
    const updatedProgress = [...userProgress];
    
    // Find the day that needs updating
    const dayIndex = updatedProgress.findIndex(d => d.id === dayId);
    
    if (dayIndex !== -1) {
      // Check if this day was completed before
      const wasCompletedBefore = updatedProgress[dayIndex].exercises.every(ex => ex.completed);
      
      // Update the exercise
      updatedProgress[dayIndex] = {
        ...updatedProgress[dayIndex],
        exercises: updatedProgress[dayIndex].exercises.map(ex => {
          if (ex.id === exerciseId) {
            return { ...ex, completed: isCompleted };
          }
          return ex;
        })
      };
      
      // Check if all exercises are now completed for this day
      const isNowCompleted = updatedProgress[dayIndex].exercises.every(ex => ex.completed);
      
      // Award XP if the day has just been completed
      if (isNowCompleted && !wasCompletedBefore) {
        // Calculate percentage completion of the entire challenge
        const totalDays = updatedProgress.length;
        const completedDays = updatedProgress.filter(day => 
          day.exercises.every(ex => ex.completed)
        ).length;
        
        // Award XP based on milestone completion
        if (challengeType === 'thirty-day') {
          // Calculate total possible XP for this challenge
          const totalPossibleXP = XP_VALUES['thirty-day'][challengeId];
          
          // Calculate XP per day
          const xpPerDay = totalPossibleXP / 30;
          
          // Award XP for completing a day
          updateUserXP(Math.round(xpPerDay));
          
          // Check if this is a completion milestone (every 10%)
          const percentComplete = (completedDays / totalDays) * 100;
          if (percentComplete % 10 === 0) {
            // Award bonus XP for hitting a milestone
            updateUserXP(Math.round(totalPossibleXP * 0.05)); // 5% bonus at each milestone
          }
        }
      }
      
      // Update state with the modified data
      setUserProgress(updatedProgress);
      
      // Save to localStorage
      if (currentUser) {
        const storageKey = `challenge-${challengeType}-${challengeId}-${currentUser.id}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
      }
    }
  };

  const calculateProgress = (day) => {
    if (!day?.exercises || day.exercises.length === 0) return 0;
    const totalExercises = day.exercises.length;
    const completedExercises = day.exercises.filter(ex => ex.completed).length;
    return (completedExercises / totalExercises) * 100;
  };

  const calculateOverallProgress = () => {
    if (!userProgress || userProgress.length === 0) return 0;
    
    const totalExercises = userProgress.reduce((sum, day) => 
      sum + day.exercises.length, 0
    );
    
    const completedExercises = userProgress.reduce((sum, day) => 
      sum + day.exercises.filter(ex => ex.completed).length, 0
    );
    
    return (completedExercises / totalExercises) * 100;
  };

  const isDayCompleted = (day) => {
    if (!day?.exercises || day.exercises.length === 0) return false;
    return day.exercises.every(ex => ex.completed);
  };

  // Mock data generator
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

  // Fix the handleRestartChallenge function implementation
  const handleRestartChallenge = () => {
    if (window.confirm('Are you sure you want to reset all progress for this challenge?')) {
      // Create a deep clone of the current progress structure
      const restartedProgress = userProgress.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => ({
          ...ex,
          completed: false
        }))
      }));
      
      // Update the state with reset progress
      setUserProgress(restartedProgress);
      
      // Reset to the first day
      setExpandedDay(restartedProgress[0].id);
      
      // Save restarted progress to localStorage
      if (currentUser) {
        const storageKey = `challenge-${challengeType}-${challengeId}-${currentUser.id}`;
        localStorage.setItem(storageKey, JSON.stringify(restartedProgress));
      }
      
      // Show confirmation to the user
      alert('Challenge progress has been reset successfully!');
    }
  };

  const updateUserXP = async (amount) => {
    // Update XP in the user's profile in supabase first to avoid race conditions
    if (currentUser) {
      try {
        // First, get the current XP from the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', currentUser.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Calculate new XP value
        const currentXP = profileData?.xp || 0;
        const newXP = currentXP + amount;
        
        // Calculate the new level based on the updated XP
        const { level: newLevel } = calculateLevel(newXP);
        
        // Update the profile with the new XP and level
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);
        
        if (updateError) throw updateError;
        
        console.log(`User XP updated in profile: +${amount} XP (new total: ${newXP}, level: ${newLevel})`);
        
        // Now update local state and localStorage AFTER the database update
        localStorage.setItem(`user-xp-${currentUser.id}`, newXP.toString());
        setUserXP(newXP);
        
        // Show XP notification
        alert(`Congratulations! You earned ${amount} XP!`);
        
      } catch (error) {
        console.error('Error updating profile XP:', error);
      }
    } else {
      // For users not logged in, just update local state
      setUserXP(prev => prev + amount);
      alert(`Congratulations! You earned ${amount} XP!`);
    }
  };

  // Add function to handle completing the entire challenge
  const handleCompleteChallenge = () => {
    if (window.confirm('Are you sure you want to mark this challenge as completed?')) {
      // Calculate current completion percentage
      const totalExercises = userProgress.reduce((sum, day) => sum + day.exercises.length, 0);
      const completedExercises = userProgress.reduce((sum, day) => 
        sum + day.exercises.filter(ex => ex.completed).length, 0
      );
      const completionPercentage = (completedExercises / totalExercises) * 100;
      
      // Calculate XP to award based on completion percentage
      const totalPossibleXP = XP_VALUES['thirty-day'][challengeId];
      const xpToAward = Math.round(totalPossibleXP * (completionPercentage / 100));
      
      // Award XP
      updateUserXP(xpToAward);
      
      // Show confirmation to the user
      alert(`Challenge completed! You earned ${xpToAward} XP based on your ${Math.round(completionPercentage)}% completion.`);
    }
  };

  if (loading || !challenge) {
    return (
      <Box className="challenge-detail-container">
        <div className="animated-bg" />
        <div className="challenge-detail-content loading">
          <LinearProgress />
        </div>
      </Box>
    );
  }

  return (
    <Box className="challenge-detail-container">
      <div className="animated-bg" />
      <div className="challenge-detail-content">
        <div className="challenge-detail-header">
          <div className="challenge-detail-top">
            <IconButton 
              className="back-button" 
              onClick={() => navigate('/challenges', { state: { defaultTab: 1 } })}
              aria-label="Back to challenges"
            >
              <ArrowBackIcon />
            </IconButton>
            
            <div className="user-xp-display detail-xp">
              <Typography variant="h6" className="xp-text">
                <EmojiEventsIcon className="xp-icon" /> {userXP} XP
              </Typography>
            </div>
          </div>
          
          <div className="challenge-detail-title-container">
            {challenge.icon}
            <Typography variant="h4" className="challenge-detail-title">
              {challenge.title}
            </Typography>
          </div>
          
          <div className="overall-progress-container">
            <Typography variant="body1" className="overall-progress-label">
              Overall Progress: {Math.round(calculateOverallProgress())}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateOverallProgress()} 
              className="overall-progress-bar"
            />
          </div>
          
          <Typography variant="body1" className="challenge-detail-description">
            {challenge.description}
          </Typography>
        </div>
        
        <Divider className="challenge-divider" />
        
        <div className="challenge-days-container">
          {userProgress.map((day, index) => (
            <Accordion 
              key={day.id}
              expanded={expandedDay === day.id}
              onChange={handleAccordionChange(day.id)}
              className={`challenge-day-accordion ${isDayCompleted(day) ? 'completed' : ''}`}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${day.id}-content`}
                id={`${day.id}-header`}
              >
                <div className="challenge-day-summary">
                  <Typography className="challenge-day-name">{day.name}</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress(day)} 
                    className="challenge-day-progress"
                  />
                  {isDayCompleted(day) && <CheckCircleIcon className="day-completed-icon" />}
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div className="exercise-details-container">
                  <div className="exercise-boxes-container">
                    {day.exercises.map((exercise) => (
                      <div 
                        key={exercise.id} 
                        className={`exercise-box ${exercise.completed ? 'completed' : ''}`}
                      >
                        <Typography className="exercise-box-title">
                          {exercise.name}
                        </Typography>
                        <Typography className="exercise-box-specs">
                          {exercise.sets} sets × {exercise.reps} reps
                        </Typography>
                        <Checkbox
                          checked={exercise.completed || false}
                          onChange={(e) => handleExerciseComplete(day.id, exercise.id, e.target.checked)}
                          className="exercise-box-checkbox"
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="contained" 
                    className="complete-all-btn"
                    onClick={() => {
                      // Create a copy of the userProgress to work with
                      const updatedProgress = [...userProgress];
                      
                      // Find the day that needs updating
                      const dayIndex = updatedProgress.findIndex(d => d.id === day.id);
                      if (dayIndex !== -1) {
                        // Mark all exercises as completed
                        updatedProgress[dayIndex] = {
                          ...updatedProgress[dayIndex],
                          exercises: updatedProgress[dayIndex].exercises.map(ex => ({
                            ...ex,
                            completed: true
                          }))
                        };
                        
                        // Update state with the modified data
                        setUserProgress(updatedProgress);
                        
                        // Save to localStorage if user is logged in
                        if (currentUser) {
                          const storageKey = `challenge-${challengeType}-${challengeId}-${currentUser.id}`;
                          localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
                        }
                      }
                    }}
                  >
                    Complete All
                  </Button>
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
        
        {/* Update the button container to add the Complete Challenge button */}
        <div className="challenge-restart-container">
          <Button 
            variant="contained" 
            className="complete-challenge-btn"
            onClick={handleCompleteChallenge}
          >
            Complete Challenge
          </Button>
          <Button 
            variant="contained" 
            className="restart-challenge-btn"
            onClick={handleRestartChallenge}
          >
            Reset Challenge
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default ChallengeDetail; 