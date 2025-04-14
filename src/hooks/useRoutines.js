import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from './useExercises';
import { calculateExerciseXP } from '../utils/xpSystem';

export const useRoutines = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const { getExercisesByIds } = useExercises();

  // Get all routines for the current user
  const getUserRoutines = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: routines, error: routinesError } = await supabase
        .from('routines')
        .select(`
          *,
          routine_exercises (
            id,
            sets,
            reps,
            xp_per_set,
            exercise_id,
            order_index
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;

      // For each routine, fetch the exercise details
      const routinesWithExercises = await Promise.all(
        (routines || []).map(async (routine) => {
          // Ensure routine_exercises exists and is an array
          const exercises = routine.routine_exercises || [];
          
          // Sort exercises by order_index
          const sortedExercises = [...exercises].sort((a, b) => 
            (a.order_index || 0) - (b.order_index || 0)
          );
          
          // Get all exercise IDs for this routine
          const exerciseIds = sortedExercises.map(ex => {
            // Convert exercise_id to proper format if needed
            const id = ex.exercise_id;
            return id ? String(id).replace(/[^0-9]/g, '') : null;
          }).filter(Boolean);
          
          // Fetch exercise details from API
          let exerciseDetails = [];
          if (exerciseIds.length > 0) {
            try {
              exerciseDetails = await getExercisesByIds(exerciseIds);
              console.log('Fetched exercise details:', exerciseDetails);
            } catch (error) {
              console.error('Error fetching exercise details:', error);
            }
          }
          
          // Map exercise details to routine_exercises
          const routine_exercises = sortedExercises.map(ex => {
            const exerciseId = String(ex.exercise_id).replace(/[^0-9]/g, '');
            const exerciseDetail = exerciseDetails.find(e => e && String(e.id) === exerciseId);
            
            if (!exerciseDetail) {
              console.log('Exercise not found for ID:', exerciseId);
            }
            
            return {
              ...ex,
              exercise: exerciseDetail || {
                id: exerciseId,
                name: `Exercise ${exerciseId} Not Found`,
                target: 'Unknown',
                equipment: 'Unknown',
                bodyPart: 'Unknown'
              }
            };
          });

          return {
            ...routine,
            routine_exercises
          };
        })
      );

      return routinesWithExercises || [];
    } catch (err) {
      console.error('Error in getUserRoutines:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new routine
  const createRoutine = async (routineData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('routines')
        .insert([
          {
            user_id: currentUser.id,
            ...routineData
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add exercise to routine
  const addExerciseToRoutine = async (routineId, exerciseData) => {
    try {
      setLoading(true);
      setError(null);

      if (!exerciseData || !routineId) {
        throw new Error('Missing required data');
      }

      // Ensure we have a valid exercise ID and details
      const exerciseId = exerciseData.exercise_id;
      if (!exerciseId) {
        throw new Error('Missing exercise ID');
      }

      // First, check if the exercise exists in our database
      const { data: existingExercise, error: checkError } = await supabase
        .from('exercises')
        .select('id')
        .eq('id', exerciseId)
        .single();

      // If exercise doesn't exist in our database, add it
      if (!existingExercise) {
        const { error: insertError } = await supabase
          .from('exercises')
          .insert([{
            id: exerciseId,
            name: exerciseData.exercise.name,
            gifurl: exerciseData.exercise.gifUrl,
            target: exerciseData.exercise.target,
            equipment: exerciseData.exercise.equipment,
            bodypart: exerciseData.exercise.bodyPart
          }]);

        if (insertError) {
          console.error('Error storing exercise details:', insertError);
        }
      }

      // Calculate XP
      const sets = Math.max(0, Number(exerciseData.sets) || 0);
      const reps = Math.max(0, Number(exerciseData.reps) || 0);
      const baseXP = calculateExerciseXP(exerciseData.exercise);
      const totalExerciseXP = Math.round(baseXP * sets * reps); // Simple multiplication

      console.log('XP Calculation:', {
        baseXP,
        sets,
        reps,
        totalExerciseXP
      });

      // Get the current routine to calculate new total XP and next order_index
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .select(`
          total_xp,
          routine_exercises (
            order_index
          )
        `)
        .eq('id', routineId)
        .single();

      if (routineError) throw routineError;

      // Calculate the next order_index
      const exercises = routine?.routine_exercises || [];
      const maxOrderIndex = exercises.length > 0
        ? Math.max(...exercises.map(ex => Number(ex.order_index) || 0))
        : -1;
      const nextOrderIndex = maxOrderIndex + 1;

      // Insert the exercise into routine_exercises
      const { data, error } = await supabase
        .from('routine_exercises')
        .insert([{
          routine_id: routineId,
          exercise_id: exerciseId,
          xp_per_set: totalExerciseXP, // Store total XP here
          sets,
          reps,
          order_index: nextOrderIndex
        }])
        .select();

      if (error) throw error;

      // Update total XP in routine
      const currentTotalXP = Number(routine?.total_xp) || 0;
      const newTotalXP = currentTotalXP + totalExerciseXP;

      const { error: updateError } = await supabase
        .from('routines')
        .update({ 
          total_xp: newTotalXP,
          updated_at: new Date().toISOString()
        })
        .eq('id', routineId);

      if (updateError) throw updateError;

      return data;
    } catch (err) {
      console.error('Error adding exercise to routine:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update routine
  const updateRoutine = async (routineId, routineData) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('routines')
        .update({
          ...routineData,
          updated_at: new Date().toISOString()
        })
        .eq('id', routineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete routine
  const deleteRoutine = async (routineId) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove exercise from routine
  const removeExerciseFromRoutine = async (routineId, exerciseId, exerciseXP) => {
    try {
      setLoading(true);
      setError(null);

      // Get current routine
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .select('total_xp')
        .eq('id', routineId)
        .single();

      if (routineError) throw routineError;

      // Remove the exercise
      const { error } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      // Update total XP (simple subtraction)
      const newTotalXP = Math.max(0, (routine.total_xp || 0) - exerciseXP);
      
      const { error: updateError } = await supabase
        .from('routines')
        .update({ 
          total_xp: newTotalXP,
          updated_at: new Date().toISOString()
        })
        .eq('id', routineId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getUserRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine
  };
}; 