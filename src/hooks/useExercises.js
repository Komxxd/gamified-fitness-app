import { useState } from 'react';
import { supabase } from '../supabase';

export const useExercises = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get exercise by ID from Supabase
  const getExerciseById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Getting exercise by ID:', id);
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching exercise:', error);
        return null;
      }

      if (!data) {
        console.log('Exercise not found for ID:', id);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error getting exercise:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get multiple exercises by IDs from Supabase
  const getExercisesByIds = async (ids) => {
    try {
      setLoading(true);
      setError(null);

      if (!ids || ids.length === 0) {
        return [];
      }

      console.log('Getting exercises by IDs:', ids);
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .in('id', ids);

      if (error) {
        console.error('Error fetching exercises:', error);
        return [];
      }

      console.log(`Found ${data?.length || 0} exercises out of ${ids.length} requested`);
      return data || [];
    } catch (err) {
      console.error('Error getting exercises:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getExerciseById,
    getExercisesByIds
  };
}; 