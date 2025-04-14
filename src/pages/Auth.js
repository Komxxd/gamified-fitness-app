import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '@mui/icons-material/Google';
import './Auth.css';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const { 
    signup, 
    login, 
    signInWithGoogle, 
    resetPassword,
    error, 
    setError,
    rememberMe,
    setRememberMe 
  } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isResetPassword) {
      try {
        setLoading(true);
        await resetPassword(formData.email);
        setError('Password reset link sent to your email');
        return;
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signup(formData.email, formData.password);
        setError('Please check your email for verification link');
      } else {
        await login(formData.email, formData.password);
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    });
    setError('');
  };

  return (
    <Box className="auth-container">
      <Box className="auth-card">
        <Typography 
          variant="h4"
          className="auth-title"
        >
          {isResetPassword 
            ? 'Reset Password'
            : (isSignUp ? 'Create Account' : 'Welcome Back')}
        </Typography>
        
        {error && (
          <Alert 
            severity={error.includes('verification') || error.includes('reset') ? 'info' : 'error'}
            className={`auth-alert ${error.includes('verification') || error.includes('reset') ? 'info' : 'error'}`}
          >
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <Stack spacing={3}>
            {!isResetPassword && isSignUp && (
              <TextField
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="auth-input"
              />
            )}
            
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
            
            {!isResetPassword && (
              <>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                
                {isSignUp && (
                  <TextField
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="auth-input"
                  />
                )}
              </>
            )}

            {!isSignUp && !isResetPassword && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label="Remember me"
                className="remember-me"
              />
            )}
            
            <Button 
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading 
                ? 'Please wait...' 
                : (isResetPassword 
                    ? 'Send Reset Link'
                    : (isSignUp ? 'Sign Up' : 'Sign In'))}
            </Button>

            {!isResetPassword && (
              <>
                <Divider className="auth-divider">
                  or
                </Divider>

                <Button
                  onClick={handleGoogleSignIn}
                  startIcon={<GoogleIcon />}
                  disabled={loading}
                  className="google-button"
                >
                  Continue with Google
                </Button>
              </>
            )}
          </Stack>
        </form>

        <Box className="auth-footer">
          <Typography>
            {isResetPassword 
              ? 'Remember your password?' 
              : (isSignUp ? 'Already have an account?' : "Don't have an account?")}
            {' '}
            <Button
              onClick={() => {
                if (isResetPassword) {
                  setIsResetPassword(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                resetForm();
              }}
              className="auth-link"
            >
              {isResetPassword 
                ? 'Sign In' 
                : (isSignUp ? 'Sign In' : 'Sign Up')}
            </Button>
          </Typography>

          {!isSignUp && !isResetPassword && (
            <Typography>
              Forgot your password?
              {' '}
              <Button
                onClick={() => {
                  setIsResetPassword(true);
                  resetForm();
                }}
                className="auth-link"
              >
                Reset it
              </Button>
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Auth; 