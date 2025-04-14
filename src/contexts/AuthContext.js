import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Calculate level based on XP
// XP required for each level follows a geometric progression
function calculateLevel(xp) {
  const baseXP = 100; // XP required for level 1
  const multiplier = 1.5; // XP multiplier for each level
  
  if (xp < baseXP) return { level: 0, xpForNextLevel: baseXP };
  
  // Calculate level using logarithm
  const level = Math.floor(Math.log(xp / baseXP) / Math.log(multiplier)) + 1;
  
  // Calculate XP required for next level
  const xpForNextLevel = baseXP * Math.pow(multiplier, level);
  
  return { level, xpForNextLevel };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sign up function
  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  // Sign in function
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        persistSession: rememberMe // Use remember me setting
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Google sign in
  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        persistSession: rememberMe
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Password reset request
  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) throw error;
  }

  // Update password
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  // Update profile
  async function updateProfile(profileData) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        updated_at: new Date(),
        ...profileData,
      });

    if (error) throw error;
  }

  // Get profile
  async function getProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser?.id)
      .single();

    if (error) throw error;
    return data;
  }

  // Sign out function
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Upload profile picture
  async function uploadProfilePicture(file) {
    try {
      if (!file || !currentUser) {
        throw new Error('File and user are required');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Upload file to Supabase
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw error;
    }
  }

  // Delete old profile picture
  async function deleteOldProfilePicture(url) {
    if (!url) return;
    try {
      const fileName = url.split('/').pop();
      await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);
    } catch (error) {
      console.error('Error deleting old profile picture:', error);
    }
  }

  // Sync XP between localStorage and Supabase
  async function syncUserXP() {
    if (!currentUser) return;
    
    try {
      // First get the current XP from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', currentUser.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Get the XP from localStorage
      const localXP = localStorage.getItem(`user-xp-${currentUser.id}`);
      
      // If we have XP in localStorage, update Supabase if needed
      if (localXP) {
        const parsedLocalXP = parseInt(localXP, 10);
        
        // If local XP is greater than the one in database, update the database
        if (parsedLocalXP > (profileData?.xp || 0)) {
          // Calculate the level based on the new XP
          const { level: newLevel } = calculateLevel(parsedLocalXP);
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              xp: parsedLocalXP,
              level: newLevel,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
          
          if (updateError) throw updateError;
          
          console.log(`Updated profile XP in database from ${profileData?.xp || 0} to ${parsedLocalXP} (level: ${newLevel})`);
          return parsedLocalXP;
        } 
        // If database XP is greater, update localStorage
        else if ((profileData?.xp || 0) > parsedLocalXP) {
          localStorage.setItem(`user-xp-${currentUser.id}`, profileData.xp.toString());
          console.log(`Updated localStorage XP from ${parsedLocalXP} to ${profileData.xp}`);
          return profileData.xp;
        }
        return parsedLocalXP;
      } 
      // If no localStorage XP but we have it in database, set localStorage
      else if (profileData?.xp) {
        localStorage.setItem(`user-xp-${currentUser.id}`, profileData.xp.toString());
        console.log(`Set localStorage XP to ${profileData.xp} from database`);
        return profileData.xp;
      }
      
      return 0;
    } catch (error) {
      console.error('Error syncing XP:', error);
      throw error;
    }
  }

  // Effect to set up auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Initial session data:', data);
        
        if (data.session) {
          setCurrentUser(data.session.user);
          console.log('User set from initial session:', data.session.user);
        } else {
          console.log('No active session found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (session) {
          setCurrentUser(session.user);
          console.log('User set from auth change:', session.user);
        } else {
          setCurrentUser(null);
          console.log('User cleared from auth change');
        }
        
        setLoading(false);
      }
    );
    
    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        console.log('Cleaning up auth listener');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateProfile,
    getProfile,
    uploadProfilePicture,
    deleteOldProfilePicture,
    error,
    setError,
    rememberMe,
    setRememberMe,
    syncUserXP
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 