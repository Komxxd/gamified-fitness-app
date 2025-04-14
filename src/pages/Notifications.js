import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      // First, let's check if we have any notifications at all
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', currentUser.id);

      if (countError) {
        console.error('Error checking notifications count:', countError);
        throw countError;
      }

      console.log('Total notifications count:', count);

      // Now fetch the notifications with a simpler query
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Fetched notifications:', data);
      setNotifications(data || []);

      // Mark notifications as read
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', currentUser.id)
          .eq('read', false);

        if (updateError) {
          console.error('Error marking notifications as read:', updateError);
        }
      }
    } catch (error) {
      console.error('Full error object:', error);
      setError('Failed to load notifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark notifications as read');
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'follow':
        return 'started following you';
      case 'unfollow':
        return 'unfollowed you';
      default:
        return 'interacted with you';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" className="notifications-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" className="page-title">
          Notifications
        </Typography>
        {notifications.length > 0 && (
          <IconButton onClick={markAllAsRead} color="primary" title="Mark all as read">
            <DoneAllIcon />
          </IconButton>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No notifications yet
        </Typography>
      ) : (
        <List className="notifications-list">
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                component={Link}
                to={`/profile/${notification.related_id}`}
              >
                <ListItemAvatar>
                  <Avatar />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography component="span" variant="body1">
                      {notification.content}
                    </Typography>
                  }
                  secondary={formatDate(notification.created_at)}
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Notifications; 