import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  TextField, 
  Button, 
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      await updatePassword(formData.password);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Box 
        sx={{ 
          background: 'var(--card-bg)',
          borderRadius: '15px',
          padding: '40px',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <Typography 
          className="heading-primary"
          sx={{ 
            textAlign: 'center',
            fontSize: { lg: '36px', xs: '28px' },
            mb: 3
          }}
        >
          Update Password
        </Typography>

        {error && (
          <Alert 
            severity="error"
            sx={{ 
              mb: 2,
              background: 'rgba(255, 38, 37, 0.1)',
              color: 'var(--primary-color)',
              '& .MuiAlert-icon': {
                color: 'var(--primary-color)'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              name="password"
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'var(--text-color)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary-color)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-color)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-color)',
                  '&.Mui-focused': {
                    color: 'var(--primary-color)',
                  },
                },
              }}
            />

            <TextField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'var(--text-color)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--primary-color)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--primary-color)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'var(--text-color)',
                  '&.Mui-focused': {
                    color: 'var(--primary-color)',
                  },
                },
              }}
            />

            <Button 
              type="submit"
              className="btn-primary"
              sx={{ 
                py: 1.5,
                fontSize: '16px'
              }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default UpdatePassword; 