import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { calculateLevel } from '../utils/xpSystem';
import WorkoutStreak from '../components/WorkoutStreak';
import CharacterSelector from '../components/CharacterSelector';
import './Profile.css';
import { supabase } from '../supabase';
import roguesSprite from '../assets/32rogues-0.5.0/32rogues/rogues.png';

const Profile = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    avatar_url: '',
    bio: '',
    level: 0,
    xp: 0,
    character: null
  });
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [routineCount, setRoutineCount] = useState(0);

  const { currentUser, updateProfile, getProfile, uploadProfilePicture, deleteOldProfilePicture, syncUserXP } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    if (!currentUser && !id) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [currentUser, id, navigate]);

  const loadProfile = async () => {
    try {
      let data;
      if (isOwnProfile) {
        // Sync XP between localStorage and Supabase to ensure the latest XP is displayed
        if (currentUser) {
          await syncUserXP();
          // Small delay to ensure the database has the latest data
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        data = await getProfile();
      } else {
        // Fetch other user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        data = profileData;

        // Check if current user is following this profile
        const { data: followData, error: followError } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', currentUser?.id)
          .eq('following_id', id)
          .single();

        if (!followError) {
          setIsFollowing(!!followData);
        }
      }

      if (data) {
        const { level } = calculateLevel(data.xp || 0);
        
        setProfileData({
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || 'No bio yet...',
          level: level,
          xp: data.xp || 0,
          character: data.character || null
        });
        setImagePreview(data.avatar_url || (isOwnProfile ? currentUser?.user_metadata?.avatar_url : null));

        // Fetch followers count
        const { count: followers, error: followersError } = await supabase
          .from('followers')
          .select('*', { count: 'exact' })
          .eq('following_id', isOwnProfile ? currentUser.id : id);

        if (!followersError) {
          setFollowersCount(followers);
        }

        // Fetch following count
        const { count: following, error: followingError } = await supabase
          .from('followers')
          .select('*', { count: 'exact' })
          .eq('follower_id', isOwnProfile ? currentUser.id : id);

        if (!followingError) {
          setFollowingCount(following);
        }

        // Fetch routines count
        const { count: routines, error: routinesError } = await supabase
          .from('routines')
          .select('*', { count: 'exact' })
          .eq('user_id', isOwnProfile ? currentUser.id : id);

        if (!routinesError) {
          setRoutineCount(routines);
        }
      }
    } catch (error) {
      setError('Failed to load profile');
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert([
            {
              follower_id: currentUser.id,
              following_id: id
            }
          ]);

        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);

        // Get follower's profile data
        const { data: followerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching follower profile:', profileError);
          throw profileError;
        }

        // Create notification for the followed user
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: id,
            type: 'follow',
            content: `${followerProfile.username} followed you`,
            related_id: currentUser.id,
            read: false,
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          setError('Failed to create notification');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError('Failed to update follow status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully');
      setOpenEdit(false);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setError('');
      setSuccess('');

      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select an image file');
          return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should be less than 5MB');
          return;
        }

        // Show loading state
        setUpdating(true);

        try {
          // Delete old profile picture if it exists
          if (profileData.avatar_url) {
            await deleteOldProfilePicture(profileData.avatar_url);
          }

          // Upload new profile picture
          const newAvatarUrl = await uploadProfilePicture(file);
          
          // Update local state
          setImagePreview(newAvatarUrl);
          setProfileData(prev => ({
            ...prev,
            avatar_url: newAvatarUrl
          }));

          setSuccess('Profile picture updated successfully');
        } catch (error) {
          console.error('Error updating profile picture:', error);
          setError(error.message || 'Failed to update profile picture');
        }
      } finally {
        setUpdating(false);
      }
    }
  };

  const getNextLevelXP = () => {
    const baseXP = 1000;
    if (profileData.xp < baseXP) return baseXP;
    return baseXP * Math.pow(2, profileData.level);
  };

  const calculateProgress = () => {
    const nextLevelXP = getNextLevelXP();
    const currentLevelXP = profileData.level === 0 ? 0 : 1000 * Math.pow(2, profileData.level - 1);
    return ((profileData.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  };

  const handleCharacterSelect = (character) => {
    setProfileData(prev => ({
      ...prev,
      character: character
    }));
  };

  if (loading) {
    return (
      <>
        <div className="profile-background"></div>
        <Box className="profile-container">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: 'var(--primary-color)' }} />
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <div className="profile-background"></div>
      <Box className="profile-container">
        <Box className="profile-card">
          <Box className="profile-header">
            <Box className="avatar-wrapper">
              {isOwnProfile && (
                <>
                  <input
                    accept="image/*"
                    type="file"
                    id="avatar-upload"
                    className="avatar-upload-input"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="avatar-upload" className="avatar-upload-label">
                    <AddAPhotoIcon />
                  </label>
                </>
              )}
              <Avatar
                src={imagePreview}
                className="profile-avatar"
              />
              <Box className="level-badge">
                {profileData.level}
              </Box>
            </Box>
            
            <Box className="profile-info">
              <Typography className="profile-username">
                {profileData.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography className="profile-stat">
                  <span className="stat-value">{followersCount}</span>
                  <span className="stat-label">Followers</span>
                </Typography>
                <Typography className="profile-stat">
                  <span className="stat-value">{followingCount}</span>
                  <span className="stat-label">Following</span>
                </Typography>
                <Typography className="profile-stat">
                  <span className="stat-value">{routineCount}</span>
                  <span className="stat-label">Routines</span>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography className="profile-level">
                  <EmojiEventsIcon sx={{ fontSize: '1.2rem', color: '#ff42a5' }} />
                  Level {profileData.level}
                </Typography>
                <Typography className="profile-level">
                  <StarIcon sx={{ fontSize: '1.2rem', color: '#5e42f4' }} />
                  {profileData.xp.toLocaleString()} XP
                </Typography>
              </Box>
            </Box>

            {!isOwnProfile && currentUser && (
              <IconButton
                className={isFollowing ? 'unfollow-button' : 'follow-button'}
                onClick={handleFollowToggle}
                size="large"
              >
                {isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
              </IconButton>
            )}

            {isOwnProfile && (
              <IconButton 
                className="edit-button"
                onClick={() => setOpenEdit(true)}
                size="small"
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box className="xp-progress">
            <Typography className="xp-progress-title">
              Progress to Level {profileData.level + 1}
            </Typography>
            <Box className="xp-progress-bar">
              <Box 
                className="xp-progress-fill" 
                sx={{ width: `${calculateProgress()}%` }}
              />
            </Box>
            <Box className="xp-progress-text">
              <Typography>
                {profileData.xp.toLocaleString()} / {getNextLevelXP().toLocaleString()} XP
              </Typography>
              <Typography>
                {Math.round(calculateProgress())}%
              </Typography>
            </Box>
          </Box>

          <Box className="profile-bio">
            <Typography className="bio-title">Bio</Typography>
            <Typography className="bio-content">
              {profileData.bio}
            </Typography>
          </Box>

          {profileData.character && (
            <Box className="character-display">
              <Typography variant="h6">Character</Typography>
              <div
                style={{
                  backgroundImage: `url(${roguesSprite})`,
                  backgroundPosition: `-${profileData.character.gridX * 32}px -${profileData.character.gridY * 32}px`,
                  width: '32px',
                  height: '32px',
                  imageRendering: 'pixelated',
                  transform: 'scale(2)',
                  margin: '10px auto'
                }}
              />
              <Typography variant="body2">{profileData.character.name}</Typography>
            </Box>
          )}

          <WorkoutStreak userId={isOwnProfile ? currentUser.id : id} />
        </Box>
      </Box>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <Dialog 
          open={openEdit} 
          onClose={() => setOpenEdit(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <TextField
                autoFocus
                margin="dense"
                name="username"
                label="Username"
                type="text"
                fullWidth
                variant="outlined"
                value={profileData.username}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="bio"
                label="Bio"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={profileData.bio}
                onChange={handleChange}
              />
              <Box mt={2}>
                <Typography variant="subtitle1">Select Your Character</Typography>
                <CharacterSelector onCharacterSelect={handleCharacterSelect} />
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenEdit(false)}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updating}
              className="btn-primary"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default Profile; 