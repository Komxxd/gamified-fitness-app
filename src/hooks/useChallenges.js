import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const useChallenges = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState({
    weekly: [],
    tenDay: [],
    thirtyDay: [],
    steps: []
  });
  const [userProgress, setUserProgress] = useState({
    weekly: [],
    tenDay: [],
    thirtyDay: {},
    steps: []
  });

  useEffect(() => {
    if (currentUser) {
      fetchChallenges();
    }
  }, [currentUser]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      // Fetch all challenges
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organize challenges by type
      const organizedChallenges = {
        weekly: challengesData.filter(c => c.type === 'weekly'),
        tenDay: challengesData.filter(c => c.type === 'tenDay'),
        thirtyDay: challengesData.filter(c => c.type === 'thirtyDay'),
        steps: challengesData.filter(c => c.type === 'steps')
      };

      setChallenges(organizedChallenges);

      // If user is logged in, fetch their progress
      if (currentUser) {
        await fetchUserProgress(challengesData.map(c => c.id));
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async (challengeIds) => {
    try {
      // Get user's challenge progress
      const { data: progressData, error } = await supabase
        .from('user_challenge_progress')
        .select(`
          id, 
          is_active, 
          completed_at,
          challenge_id,
          challenges(id, type, category)
        `)
        .eq('user_id', currentUser.id)
        .in('challenge_id', challengeIds);

      if (error) throw error;

      // Get days progress for each challenge
      const userChallengeProgressIds = progressData.map(p => p.id);
      
      if (userChallengeProgressIds.length > 0) {
        const { data: daysProgressData, error: daysError } = await supabase
          .from('user_challenge_day_progress')
          .select(`
            id,
            completed,
            step_count,
            user_challenge_progress_id,
            challenge_day_id,
            challenge_days(id, day_number, challenge_id)
          `)
          .in('user_challenge_progress_id', userChallengeProgressIds);

        if (daysError) throw daysError;

        // Get exercises progress for each day
        const dayProgressIds = daysProgressData.map(d => d.id);
        
        if (dayProgressIds.length > 0) {
          const { data: exercisesProgressData, error: exercisesError } = await supabase
            .from('user_challenge_exercise_progress')
            .select(`
              id,
              completed,
              user_challenge_day_progress_id,
              challenge_exercise_id
            `)
            .in('user_challenge_day_progress_id', dayProgressIds);

          if (exercisesError) throw exercisesError;

          // Organize all the data
          const organizedProgress = organizeProgressData(
            progressData, 
            daysProgressData, 
            exercisesProgressData
          );
          
          setUserProgress(organizedProgress);
        }
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const organizeProgressData = (progressData, daysData, exercisesData) => {
    // Create a map to organize data by challenge type
    const organizedData = {
      weekly: [],
      tenDay: [],
      thirtyDay: {},
      steps: []
    };

    progressData.forEach(progress => {
      const challengeType = progress.challenges.type;
      const challengeId = progress.challenge_id;
      
      // Filter days for this challenge
      const challengeDays = daysData.filter(
        day => day.challenge_days.challenge_id === challengeId
      );
      
      // Organize days with their exercises
      const organizedDays = challengeDays.map(day => {
        // Find exercises for this day
        const dayExercises = exercisesData.filter(
          ex => ex.user_challenge_day_progress_id === day.id
        );
        
        return {
          ...day,
          exercises: dayExercises
        };
      });
      
      // Add to the appropriate section
      if (challengeType === 'weekly') {
        organizedData.weekly.push({
          ...progress,
          days: organizedDays
        });
      } else if (challengeType === 'tenDay') {
        organizedData.tenDay.push({
          ...progress,
          days: organizedDays
        });
      } else if (challengeType === 'steps') {
        organizedData.steps.push({
          ...progress,
          days: organizedDays
        });
      } else if (challengeType === 'thirtyDay') {
        const category = progress.challenges.category;
        if (!organizedData.thirtyDay[category]) {
          organizedData.thirtyDay[category] = [];
        }
        organizedData.thirtyDay[category].push({
          ...progress,
          days: organizedDays
        });
      }
    });
    
    return organizedData;
  };

  const startChallenge = async (challengeId) => {
    try {
      if (!currentUser) return null;
      
      // Check if user already has this challenge active
      const { data: existing, error: checkError } = await supabase
        .from('user_challenge_progress')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('challenge_id', challengeId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // If already active, return it
      if (existing) return existing.id;
      
      // Otherwise create a new progress record
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .insert({
          user_id: currentUser.id,
          challenge_id: challengeId,
          is_active: true
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Refresh challenges
      fetchChallenges();
      
      return data.id;
    } catch (error) {
      console.error('Error starting challenge:', error);
      return null;
    }
  };

  const completeExercise = async (dayProgressId, exerciseId, isCompleted) => {
    try {
      if (!currentUser) return false;
      
      // Check if there's already a record
      const { data: existing, error: checkError } = await supabase
        .from('user_challenge_exercise_progress')
        .select('id')
        .eq('user_challenge_day_progress_id', dayProgressId)
        .eq('challenge_exercise_id', exerciseId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_challenge_exercise_progress')
          .update({
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('user_challenge_exercise_progress')
          .insert({
            user_challenge_day_progress_id: dayProgressId,
            challenge_exercise_id: exerciseId,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
          });
        
        if (error) throw error;
      }
      
      // Check if all exercises for the day are completed
      const { data: allExercises, error: exercisesError } = await supabase
        .from('challenge_exercises')
        .select('id')
        .eq('challenge_day_id', dayProgressId);
      
      if (exercisesError) throw exercisesError;
      
      const { data: completedExercises, error: completedError } = await supabase
        .from('user_challenge_exercise_progress')
        .select('id')
        .eq('user_challenge_day_progress_id', dayProgressId)
        .eq('completed', true);
      
      if (completedError) throw completedError;
      
      // If all exercises are completed, mark the day as completed
      const allCompleted = allExercises.length === completedExercises.length;
      
      const { error: updateDayError } = await supabase
        .from('user_challenge_day_progress')
        .update({
          completed: allCompleted,
          completed_at: allCompleted ? new Date().toISOString() : null
        })
        .eq('id', dayProgressId);
      
      if (updateDayError) throw updateDayError;
      
      // Refresh challenges
      fetchChallenges();
      
      return true;
    } catch (error) {
      console.error('Error completing exercise:', error);
      return false;
    }
  };

  const updateStepCount = async (dayProgressId, stepCount) => {
    try {
      if (!currentUser) return false;
      
      const { error } = await supabase
        .from('user_challenge_day_progress')
        .update({
          step_count: stepCount,
          completed: stepCount >= 15000, // Assuming 15K is the goal
          completed_at: stepCount >= 15000 ? new Date().toISOString() : null
        })
        .eq('id', dayProgressId);
      
      if (error) throw error;
      
      // Refresh challenges
      fetchChallenges();
      
      return true;
    } catch (error) {
      console.error('Error updating step count:', error);
      return false;
    }
  };

  const completeChallenge = async (challengeProgressId) => {
    try {
      if (!currentUser) return false;
      
      const { error } = await supabase
        .from('user_challenge_progress')
        .update({
          completed_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', challengeProgressId);
      
      if (error) throw error;
      
      // Get challenge XP
      const { data: challenge, error: challengeError } = await supabase
        .from('user_challenge_progress')
        .select('challenges(total_xp)')
        .eq('id', challengeProgressId)
        .single();
      
      if (challengeError) throw challengeError;
      
      // Update user XP
      const xpToAdd = challenge.challenges.total_xp || 0;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: supabase.raw(`xp + ${xpToAdd}`)
        })
        .eq('id', currentUser.id);
      
      if (profileError) throw profileError;
      
      // Refresh challenges
      fetchChallenges();
      
      return true;
    } catch (error) {
      console.error('Error completing challenge:', error);
      return false;
    }
  };

  return {
    loading,
    challenges,
    userProgress,
    startChallenge,
    completeExercise,
    updateStepCount,
    completeChallenge,
    refreshChallenges: fetchChallenges
  };
};

export default useChallenges; 