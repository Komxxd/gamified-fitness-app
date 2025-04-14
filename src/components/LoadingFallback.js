import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    backgroundColor: '#1a1b2f'
  }}>
    <CircularProgress sx={{ color: '#5e42f4' }} />
  </Box>
);

export default LoadingFallback; 