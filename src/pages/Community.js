import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  TextField,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Alert,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { Link, useNavigate } from 'react-router-dom';
import './Community.css';

const Community = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [followingStatus, setFollowingStatus] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    searchUsers();
  }, [currentUser, navigate]);

  // Fetch following status for all displayed users
  const fetchFollowingStatus = async (userIds) => {
    try {
      if (!currentUser) return;
      
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUser.id)
        .in('following_id', userIds);

      if (error) throw error;

      const statusMap = {};
      data.forEach(item => {
        statusMap[item.following_id] = true;
      });
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Error fetching following status:', error);
    }
  };

  const searchUsers = async () => {
    try {
      if (!currentUser) return;
      
      setLoading(true);
      setError('');

      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id);

      if (searchQuery) {
        query = query.ilike('username', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      setUsers(data || []);
      if (data?.length > 0) {
        await fetchFollowingStatus(data.map(user => user.id));
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      if (!currentUser) return;
      
      const isFollowing = followingStatus[userId];

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) throw error;

        setFollowingStatus(prev => ({
          ...prev,
          [userId]: false
        }));
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });

        if (error) throw error;

        setFollowingStatus(prev => ({
          ...prev,
          [userId]: true
        }));
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      setError('Failed to update follow status');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchUsers();
  };

  return (
    <Container maxWidth="md" className="community-container">
      <Typography variant="h4" component="h1" className="page-title">
        Community
      </Typography>

      <Box component="form" onSubmit={handleSearch} className="search-box">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box className="users-grid">
          {users.map(user => (
            <Card key={user.id} className="user-card">
              <CardContent>
                <Box className="user-card-content">
                  <Box className="user-info">
                    <Avatar
                      src={user.avatar_url}
                      alt={user.username}
                      component={Link}
                      to={`/profile/${user.id}`}
                      className="user-avatar"
                    />
                    <Box>
                      <Typography variant="h6" component={Link} to={`/profile/${user.id}`} className="username-link">
                        {user.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="user-bio">
                        {user.bio?.substring(0, 100)}{user.bio?.length > 100 ? '...' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => handleFollowToggle(user.id)}
                    className={followingStatus[user.id] ? 'unfollow-button' : 'follow-button'}
                  >
                    {followingStatus[user.id] ? <PersonRemoveIcon /> : <PersonAddIcon />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Community;
