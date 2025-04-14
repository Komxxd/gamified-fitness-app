/**
 * Experience Points (XP) System
 * 
 * This module implements a gamification system that rewards users for their workout activities.
 * XP is calculated based on various factors including exercise complexity, equipment used,
 * and the muscle groups targeted.
 */

// XP multipliers for different equipment types
const equipmentXP = {
  'body weight': 10, 
  'dumbbell': 15,
  'barbell': 20,
  'cable': 15,
  'leverage machine': 12,
  'band': 12,
  'smith machine': 18,
  'kettlebell': 18,
  'weighted': 20,
  'assisted': 8,
  'default': 15
};

// XP multipliers for different muscle groups (larger muscles = more XP)
const targetMuscleXP = {
  'abductors': 15,
  'abs': 12,
  'adductors': 15,
  'biceps': 12,
  'calves': 12,
  'cardiovascular system': 20,
  'delts': 15,
  'forearms': 10,
  'glutes': 20,
  'hamstrings': 20,
  'lats': 20,
  'levator scapulae': 12,
  'pectorals': 20,
  'quads': 20,
  'serratus anterior': 12,
  'spine': 15,
  'traps': 15,
  'triceps': 12,
  'upper back': 20,
  'default': 15
};

// XP multipliers for different body parts
const bodyPartXP = {
  'back': 20,
  'cardio': 20,
  'chest': 20,
  'lower arms': 12,
  'lower legs': 15,
  'neck': 10,
  'shoulders': 15,
  'upper arms': 15,
  'upper legs': 20,
  'waist': 15,
  'default': 15
};

/**
 * Calculate XP value for a specific exercise
 * XP is determined by:
 * - Equipment complexity (free weights > machines)
 * - Exercise type (compound > isolation)
 * - Target muscle group size (larger muscles = more XP)
 * 
 * @param {Object} exercise - The exercise object containing details
 * @returns {number} The calculated XP value
 */
export const calculateExerciseXP = (exercise) => {
  if (!exercise) return 0;

  let baseXP = 100; 
  let multiplier = 1.0;

  // Equipment-based multipliers
  const equipmentMultipliers = {
    'barbell': 1.5,      
    'dumbbell': 1.3,     
    'kettlebell': 1.2,   
    'cable': 1.1,        
    'body weight': 1.0,  
    'leverage machine': 0.8, 
    'band': 0.9,         
    'smith machine': 0.7 
  };

  // Target muscle group multipliers
  const targetMultipliers = {
    'quads': 1.4,        
    'glutes': 1.4,       
    'lats': 1.3,         
    'pectorals': 1.3,    
    'hamstrings': 1.3,   
    'calves': 1.0,      
    'triceps': 1.1,     
    'biceps': 1.1,       
    'forearms': 1.0,     
    'abs': 1.2,          
    'delts': 1.2,       
    'traps': 1.2         
  };

  // Apply equipment multiplier
  if (exercise.equipment && equipmentMultipliers[exercise.equipment.toLowerCase()]) {
    multiplier *= equipmentMultipliers[exercise.equipment.toLowerCase()];
  }

  // Apply target muscle multiplier
  if (exercise.target && targetMultipliers[exercise.target.toLowerCase()]) {
    multiplier *= targetMultipliers[exercise.target.toLowerCase()];
  }

  // Calculate final XP
  const finalXP = Math.round(baseXP * multiplier);
  return Math.max(50, Math.min(finalXP, 300)); // Cap XP between 50 and 300
};

/**
 * Calculate user level and progress based on total XP
 * Uses a logarithmic progression system where each level requires
 * exponentially more XP than the previous level.
 * 
 * @param {number} totalXP - The user's total accumulated XP
 * @returns {Object} Object containing:
 *   - level: Current level number
 *   - currentXP: Total XP accumulated
 *   - nextLevelXP: XP required for next level
 *   - progress: Percentage progress to next level (0-100)
 */
export const calculateLevel = (totalXP) => {
  const baseXP = 1000; // Base XP required for level 1
  
  if (totalXP < baseXP) {
    return {
      level: 0,
      currentXP: totalXP,
      nextLevelXP: baseXP,
      progress: (totalXP / baseXP) * 100
    };
  }
  
  // Calculate level using logarithmic progression
  const level = Math.floor(Math.log2(totalXP / baseXP)) + 1;
  
  // Calculate XP thresholds
  const currentLevelXP = baseXP * Math.pow(2, level - 1);
  const nextLevelXP = baseXP * Math.pow(2, level);
  
  // Calculate progress percentage
  const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return {
    level,
    currentXP: totalXP,
    nextLevelXP,
    progress: Math.min(100, Math.max(0, progress)) // Ensure progress is between 0 and 100
  };
};

