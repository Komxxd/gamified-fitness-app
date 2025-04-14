import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from './useExercises';
import { calculateExerciseXP, calculateLevel } from '../utils/xpSystem';

function useWorkouts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Start a new workout session
  const startWorkout = async (routineId, routineExercises) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      if (!routineId) {
        throw new Error('No routine ID provided');
      }
      
      if (!routineExercises || !Array.isArray(routineExercises) || routineExercises.length === 0) {
        throw new Error('No exercises in routine');
      }
      
      setLoading(true);
      setError(null);

      // Check if user is still authenticated
      const { data: authSession, error: authError } = await supabase.auth.getSession();
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      if (!authSession?.session) {
        throw new Error('Your session has expired. Please log in again.');
      }

      // Fetch the routine's total XP from the database
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .select('total_xp')
        .eq('id', routineId)
        .single();

      if (routineError) {
        throw new Error(`Failed to fetch routine data: ${routineError.message}`);
      }

      if (!routine) {
        throw new Error('Routine not found');
      }

      console.log('Fetched routine data:', routine);

      // Create a new workout session with the routine's total XP
      const workoutSessionData = {
        user_id: currentUser.id,
        routine_id: routineId,
        start_time: new Date().toISOString(),
        total_xp: routine.total_xp,
        status: 'in_progress'
      };
      
      console.log('Creating workout session with data:', workoutSessionData);
      
      const { data: workoutSession, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert(workoutSessionData)
        .select('*')
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(`Failed to create workout session: ${sessionError.message}`);
      }
      
      if (!workoutSession?.id) {
        throw new Error('No workout session was created');
      }
      
      console.log('Workout session created:', workoutSession);

      // Create workout exercises for each routine exercise
      const workoutExercisesData = routineExercises.map(exercise => {
        if (!exercise?.id || !exercise?.exercise?.id) {
          throw new Error('Invalid exercise data in routine');
        }
        return {
          workout_session_id: workoutSession.id,
          routine_exercise_id: exercise.id,
          exercise_id: exercise.exercise.id,
          sets_completed: 0,
          total_reps_completed: 0,
          xp_earned: exercise.total_xp,
          completed: false,
          target_sets: exercise.sets,
          target_reps: exercise.reps
        };
      });
      
      console.log('Creating workout exercises with data:', workoutExercisesData);

      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercisesData)
        .select('*, exercise:exercises(*)');

      if (exercisesError) {
        console.error('Exercises creation error:', exercisesError);
        throw new Error(`Failed to create workout exercises: ${exercisesError.message}`);
      }
      
      if (!workoutExercises || workoutExercises.length === 0) {
        throw new Error('No workout exercises were created');
      }
      
      console.log('Workout exercises created:', workoutExercises);

      // Create workout sets for each exercise
      const workoutSetsData = [];
      
      for (const exercise of workoutExercises) {
        const routineExercise = routineExercises.find(re => re.id === exercise.routine_exercise_id);
        
        if (!routineExercise) {
          console.error('Could not find matching routine exercise for:', exercise);
          continue;
        }
        
        for (let i = 1; i <= routineExercise.sets; i++) {
          workoutSetsData.push({
            workout_exercise_id: exercise.id,
            set_number: i,
            target_reps: routineExercise.reps,
            reps: 0,
            weight: 0,
            completed: false,
            rest_time: 60, // Default rest time: 60 seconds
            notes: '' // Allow notes for each set
          });
        }
      }
      
      if (workoutSetsData.length === 0) {
        throw new Error('No workout sets to create');
      }
      
      console.log('Creating workout sets with data:', workoutSetsData);

      const { data: workoutSets, error: setsError } = await supabase
        .from('workout_sets')
        .insert(workoutSetsData)
        .select();

      if (setsError) {
        console.error('Sets creation error:', setsError);
        throw new Error(`Failed to create workout sets: ${setsError.message}`);
      }
      
      if (!workoutSets || workoutSets.length === 0) {
        throw new Error('No workout sets were created');
      }
      
      console.log('Workout sets created:', workoutSets);

      // Organize the data for return
      const result = {
        ...workoutSession,
        workout_exercises: workoutExercises.map(we => ({
          ...we,
          workout_sets: workoutSets
            .filter(ws => ws.workout_exercise_id === we.id)
            .sort((a, b) => a.set_number - b.set_number)
        }))
      };

      console.log('Final workout result:', result);
      return result;
    } catch (err) {
      console.error('Error starting workout:', err);
      setError(err.message || 'An unknown error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get active workout session
  const getActiveWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_exercises (
            *,
            workout_sets (*)
          )
        `)
        .eq('user_id', currentUser.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1);

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        return null;
      }

      // Get exercise details for each workout exercise
      const workoutSession = sessions[0];
      const exerciseIds = workoutSession.workout_exercises.map(we => we.exercise_id);

      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      if (exercisesError) throw exercisesError;

      // Add exercise details to each workout exercise
      workoutSession.workout_exercises = workoutSession.workout_exercises.map(we => {
        const exerciseDetails = exercises.find(e => e.id === we.exercise_id);
        return {
          ...we,
          exercise: exerciseDetails
        };
      });

      return workoutSession;
    } catch (err) {
      console.error('Error getting active workout:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get workout history
  const getWorkoutHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_exercises (
            *,
            workout_sets (*)
          )
        `)
        .eq('user_id', currentUser.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      return sessions || [];
    } catch (err) {
      console.error('Error getting workout history:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update workout set with progress
  const updateWorkoutSet = async (setId, setData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating workout set:', { setId, setData });

      // Get the existing set first
      const { data: existingSet, error: getError } = await supabase
        .from('workout_sets')
        .select('*, workout_exercise:workout_exercises(*)')
        .eq('id', setId)
        .single();

      if (getError) {
        console.error('Error fetching existing set:', getError);
        throw getError;
      }

      if (!existingSet) {
        throw new Error('Set not found');
      }

      // Prepare update data
      const updatedSetData = {
        ...setData,
        updated_at: new Date().toISOString(),
        completed: setData.completed ?? existingSet.completed,
        reps: setData.reps ?? existingSet.reps
      };

      console.log('Updating set with data:', updatedSetData);

      // Update the set
      const { data: updatedSet, error: updateError } = await supabase
        .from('workout_sets')
        .update(updatedSetData)
        .eq('id', setId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating set:', updateError);
        throw updateError;
      }

      if (!updatedSet) {
        throw new Error('Failed to update set');
      }

      console.log('Set updated successfully:', updatedSet);

      // Update exercise progress
      if (setData.completed !== undefined || setData.reps !== undefined) {
        console.log('Updating exercise progress...');
        await updateWorkoutExerciseProgress(existingSet.workout_exercise_id);
      }

      return updatedSet;
    } catch (err) {
      console.error('Error in updateWorkoutSet:', err);
      setError(err.message);
      throw err; // Re-throw to handle in the component
    } finally {
      setLoading(false);
    }
  };

  // Update workout exercise progress
  const updateWorkoutExerciseProgress = async (workoutExerciseId) => {
    try {
      // Get all sets for this exercise
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_exercise_id', workoutExerciseId);

      if (setsError) throw setsError;

      // Calculate progress
      const totalSets = sets.length;
      const completedSets = sets.filter(set => set.completed).length;
      const totalRepsCompleted = sets
        .filter(set => set.completed)
        .reduce((sum, set) => sum + (set.reps || 0), 0);

      // Update workout exercise progress only
      const { data, error } = await supabase
        .from('workout_exercises')
        .update({
          sets_completed: completedSets,
          total_reps_completed: totalRepsCompleted,
          completed: completedSets === totalSets,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutExerciseId)
        .select()
        .single();

      if (error) throw error;

      // If all sets are completed, update the workout session
      if (completedSets === totalSets) {
        await updateWorkoutSessionProgress(data.workout_session_id);
      }

      return data;
    } catch (err) {
      console.error('Error updating workout exercise progress:', err);
      setError(err.message);
      return null;
    }
  };

  // Update workout session progress
  const updateWorkoutSessionProgress = async (workoutSessionId) => {
    try {
      // Get all exercises for this session
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_session_id', workoutSessionId);

      if (exercisesError) throw exercisesError;

      // Check if all exercises are completed
      const allCompleted = exercises.every(exercise => exercise.completed);

      // Update workout session status only
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          status: allCompleted ? 'completed' : 'in_progress',
          end_time: allCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutSessionId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error updating workout session progress:', err);
      setError(err.message);
      return null;
    }
  };

  // Complete workout
  const completeWorkout = async (workoutSessionId) => {
    try {
      setLoading(true);
      setError(null);

      // Get the workout session with all related data
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_exercises (
            *,
            workout_sets (*),
            exercise:exercises(*)
          )
        `)
        .eq('id', workoutSessionId)
        .single();

      if (sessionError) throw sessionError;

      // Verify all sets are completed
      const allSetsCompleted = session.workout_exercises.every(exercise => 
        exercise.workout_sets.every(set => set.completed)
      );

      if (!allSetsCompleted) {
        throw new Error('Cannot complete workout: Some sets are not completed');
      }

      // Use the original total_xp from the session
      const totalXP = session.total_xp;

      // Update the workout session
      const { error: updateError } = await supabase
        .from('workout_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutSessionId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error('Error completing workout:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user's XP
  const updateUserXP = async (xpToAdd) => {
    try {
      if (!currentUser?.id || !xpToAdd) return;

      // Get current user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', currentUser.id)
        .single();

      if (profileError) throw profileError;

      // Calculate new XP and level using the proper calculation
      const newXP = (profile?.xp || 0) + xpToAdd;
      const { level: newLevel } = calculateLevel(newXP);

      // Update profile with new XP and level
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      return { newXP, newLevel };
    } catch (err) {
      console.error('Error updating user XP:', err);
      setError(err.message);
      return null;
    }
  };

  // Terminate an active workout session
  const terminateWorkout = async (workoutSessionId) => {
    try {
      if (!currentUser?.id) {
        console.error('Termination failed: User not authenticated');
        throw new Error('User not authenticated. Please log in again.');
      }
      
      if (!workoutSessionId) {
        console.error('Termination failed: No workout session ID provided');
        throw new Error('No workout session ID provided');
      }
      
      setLoading(true);
      setError(null);

      console.log(`[TERMINATE] Starting termination of workout session: ${workoutSessionId}`);

      // First, verify the workout session exists and belongs to the current user
      const { data: sessionCheck, error: sessionCheckError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('id', workoutSessionId)
        .eq('user_id', currentUser.id)
        .single();

      if (sessionCheckError) {
        console.error('[TERMINATE] Error verifying workout session:', sessionCheckError);
        if (sessionCheckError.code === 'PGRST116') {
          // No matching session found - it might already be deleted
          console.log('[TERMINATE] No matching workout session found, it may already be deleted');
          return true;
        }
        throw new Error(`Failed to verify workout session: ${sessionCheckError.message}`);
      }

      if (!sessionCheck) {
        console.log('[TERMINATE] No workout session found with ID:', workoutSessionId);
        return true; // Session doesn't exist, so it's effectively "terminated"
      }

      // Use a more direct approach - delete all related data in a specific order
      
      // 1. First, get all workout exercises for this session
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_session_id', workoutSessionId);

      if (exercisesError) {
        console.error('[TERMINATE] Error fetching workout exercises:', exercisesError);
        throw new Error(`Failed to fetch workout exercises: ${exercisesError.message}`);
      }

      console.log(`[TERMINATE] Found ${workoutExercises?.length || 0} workout exercises to delete`);

      // 2. If there are workout exercises, delete their sets first
      if (workoutExercises && workoutExercises.length > 0) {
        const exerciseIds = workoutExercises.map(we => we.id);
        
        // Delete sets one by one to avoid potential issues with bulk operations
        for (const exerciseId of exerciseIds) {
          console.log(`[TERMINATE] Deleting workout sets for exercise: ${exerciseId}`);
          
          const { error: setsDeleteError } = await supabase
            .from('workout_sets')
            .delete()
            .eq('workout_exercise_id', exerciseId);

          if (setsDeleteError) {
            console.error(`[TERMINATE] Error deleting workout sets for exercise ${exerciseId}:`, setsDeleteError);
            throw new Error(`Failed to delete workout sets: ${setsDeleteError.message}`);
          }
        }
        
        console.log('[TERMINATE] Successfully deleted all workout sets');

        // 3. Delete workout exercises one by one
        for (const exerciseId of exerciseIds) {
          console.log(`[TERMINATE] Deleting workout exercise: ${exerciseId}`);
          
          const { error: exerciseDeleteError } = await supabase
            .from('workout_exercises')
            .delete()
            .eq('id', exerciseId);

          if (exerciseDeleteError) {
            console.error(`[TERMINATE] Error deleting workout exercise ${exerciseId}:`, exerciseDeleteError);
            throw new Error(`Failed to delete workout exercise: ${exerciseDeleteError.message}`);
          }
        }
        
        console.log('[TERMINATE] Successfully deleted all workout exercises');
      }

      // 4. Finally, delete the workout session
      console.log(`[TERMINATE] Deleting workout session: ${workoutSessionId}`);
      
      const { error: deleteError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', workoutSessionId)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        console.error('[TERMINATE] Error deleting workout session:', deleteError);
        throw new Error(`Failed to terminate workout session: ${deleteError.message}`);
      }
      
      console.log('[TERMINATE] Successfully terminated workout session');

      // 5. Verify the workout is actually gone
      const { data: remainingWorkout, error: checkError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('id', workoutSessionId)
        .single();
        
      if (checkError && checkError.code === 'PGRST116') {
        // This is the expected error - no rows found
        console.log('[TERMINATE] Verified workout session no longer exists in database');
        return true;
      } else if (remainingWorkout) {
        console.error('[TERMINATE] Workout still exists after deletion attempt');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[TERMINATE] Error terminating workout session:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Return all the functions and state
  return {
    loading,
    error,
    startWorkout,
    getActiveWorkout,
    getWorkoutHistory,
    updateWorkoutSet,
    updateWorkoutExerciseProgress,
    updateWorkoutSessionProgress,
    completeWorkout,
    updateUserXP,
    terminateWorkout,
  };
}

export default useWorkouts; 