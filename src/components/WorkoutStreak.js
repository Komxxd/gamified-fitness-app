import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { supabase } from '../supabase';

const WorkoutStreak = ({ userId }) => {
  const [streakData, setStreakData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, [userId]);

  const loadStreakData = async () => {
    try {
      // Get workout data for the last 365 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('start_time, total_xp')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Process the data into a daily XP map
      const dailyXP = {};
      data.forEach(session => {
        const date = new Date(session.start_time).toISOString().split('T')[0];
        dailyXP[date] = (dailyXP[date] || 0) + (session.total_xp || 0);
      });

      setStreakData(dailyXP);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForXP = (xp) => {
    if (!xp) return '#1a1b2f'; // No activity
    if (xp < 500) return '#1e4d8f'; // Light activity
    if (xp < 1000) return '#2f78dd'; // Moderate activity
    if (xp < 2000) return '#42a4ff'; // Good activity
    return '#5e42f4'; // Intense activity
  };

  const generateLastYear = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        xp: streakData[dateStr] || 0
      });
    }

    return days;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthLabels = () => {
    const months = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    
    let currentMonth = startDate.getMonth();
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      if (currentDate.getMonth() !== currentMonth) {
        months.push({
          month: currentDate.toLocaleString('en-US', { month: 'short' }),
          x: months.length * 30 // Approximate position
        });
        currentMonth = currentDate.getMonth();
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return months;
  };

  if (loading) return null;

  const yearData = generateLastYear();
  const weeks = [];
  for (let i = 0; i < yearData.length; i += 7) {
    weeks.push(yearData.slice(i, i + 7));
  }

  const monthLabels = getMonthLabels();

  return (
    <Box className="workout-streak" sx={{ mt: 3, pb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
        Workout Activity
      </Typography>
      
      {/* Month labels */}
      <Box sx={{ 
        display: 'flex',
        ml: '20px',
        mb: 1,
        gap: '24px'
      }}>
        {monthLabels.map((month, index) => (
          <Typography 
            key={index}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              minWidth: '30px'
            }}
          >
            {month.month}
          </Typography>
        ))}
      </Box>

      <Box sx={{ 
        display: 'flex',
        gap: '3px'
      }}>
        {/* Day labels */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          mr: 1,
          mt: '2px'
        }}>
          {['Mon', 'Wed', 'Fri'].map((day) => (
            <Typography 
              key={day}
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.65rem',
                height: '27px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Contribution graph */}
        <Box sx={{ 
          display: 'flex',
          gap: '3px',
          maxWidth: 'calc(100% - 30px)',
          overflowX: 'auto'
        }}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {week.map((day) => (
                <Tooltip
                  key={day.date}
                  title={`${formatDate(day.date)}: ${day.xp} XP`}
                  arrow
                >
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: getColorForXP(day.xp),
                      borderRadius: '2px',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.2)',
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mt: 2,
        justifyContent: 'flex-end'
      }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
          Less
        </Typography>
        {[0, 500, 1000, 2000, 3000].map((xp) => (
          <Box
            key={xp}
            sx={{
              width: '10px',
              height: '10px',
              backgroundColor: getColorForXP(xp),
              borderRadius: '2px'
            }}
          />
        ))}
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
          More
        </Typography>
      </Box>
    </Box>
  );
};

export default WorkoutStreak; 