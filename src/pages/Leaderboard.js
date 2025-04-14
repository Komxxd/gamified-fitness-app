import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Container,
  Typography,
  Avatar,
  Box,
  CircularProgress,
  Card,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import './Leaderboard.css';
import roguesSprite from '../assets/32rogues-0.5.0/32rogues/rogues.png';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, syncUserXP } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Sync current user's XP between localStorage and Supabase
      if (currentUser) {
        await syncUserXP();
      }
      
      // Small delay to ensure Supabase has the latest data
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, level, character')
        .order('xp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return {
          borderColor: '#FFD700',
          color: '#FFD700'
        };
      case 1:
        return {
          borderColor: '#C0C0C0',
          color: '#C0C0C0'
        };
      case 2:
        return {
          borderColor: '#CD7F32',
          color: '#CD7F32'
        };
      default:
        return {
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'rgba(255, 255, 255, 0.7)'
        };
    }
  };

  if (loading) {
    return (
      <Container className="leaderboard-loading">
        <CircularProgress sx={{ color: '#ff42a5' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          Error loading leaderboard: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <>
      <div className="leaderboard-page-background"></div>
      <Container maxWidth="md" className="leaderboard-container">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h2" className="leaderboard-title">
            Leaderboard
          </Typography>
          <Tooltip title="Refresh Leaderboard">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing} 
              sx={{ 
                color: '#ff42a5',
                '&:hover': { color: '#ff65b6' } 
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box className="leaderboard-list">
          {users.map((user, index) => {
            const rankStyle = getRankStyle(index);
            return (
              <Card key={user.id} className="leaderboard-item">
                <Box className="rank-circle" style={{ 
                  borderColor: rankStyle.borderColor,
                  color: rankStyle.color
                }}>
                  {index + 1}
                </Box>
                <Box className="player-info">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.username}
                    className="player-avatar"
                    style={{
                      border: index < 3 ? `2px solid ${rankStyle.borderColor}` : 'none'
                    }}
                  />
                  <Box className="player-details">
                    <Typography className="player-name">
                      {user.username || 'Anonymous User'}
                    </Typography>
                    <Box className="player-stats">
                      <Typography className="player-level">
                        Level {user.level}
                      </Typography>
                      <Typography className="player-xp">
                        {user.xp.toLocaleString()} XP
                      </Typography>
                    </Box>
                  </Box>
                  {user.character && (
                    <Box className="player-character">
                      <div
                        style={{
                          backgroundImage: `url(${roguesSprite})`,
                          backgroundPosition: `-${user.character.gridX * 32}px -${user.character.gridY * 32}px`,
                          width: '32px',
                          height: '32px',
                          imageRendering: 'pixelated',
                          transform: 'scale(1.5)',
                          margin: '0 auto'
                        }}
                      />
                      <Typography variant="caption" className="character-name">
                        {user.character.name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      </Container>
    </>
  );
};

export default Leaderboard; 