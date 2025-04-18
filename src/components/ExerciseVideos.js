import React from 'react';
import { Typography, Box, Stack } from '@mui/material';
import Loader from './Loader';

const ExerciseVideos = ({ exerciseVideos, name }) => {
  if (!exerciseVideos.length) return <Loader />;

  return (
    <Box sx={{ mt: { lg: '50px', xs: '20px' } }} p="20px">
      <Typography 
        className="heading-primary"
        sx={{ 
          fontSize: { lg: '44px', xs: '25px' },
          mb: '33px',
          textAlign: 'center'
        }}
      >
        Watch <span className="text-primary" style={{ textTransform: 'capitalize' }}>{name}</span> exercise videos
      </Typography>
      <Stack 
        direction="row" 
        sx={{ 
          gap: { lg: '30px', xs: '20px' },
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {exerciseVideos?.slice(0, 3)?.map((item, index) => (
          <a
            key={index}
            className="exercise-video"
            href={`https://www.youtube.com/watch?v=${item.video.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            <img src={item.video.thumbnails[0].url} alt={item.video.title} />
            <Box sx={{ p: 2 }}>
              <Typography 
                sx={{ 
                  fontSize: { lg: '22px', xs: '18px' },
                  fontWeight: 600,
                  color: 'var(--text-color)',
                  fontFamily: 'var(--font-primary)',
                  mb: 1
                }}
              >
                {item.video.title}
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '14px',
                  color: '#ddd',
                  fontFamily: 'var(--font-secondary)'
                }}
              >
                {item.video.channelName}
              </Typography>
            </Box>
          </a>
        ))}
      </Stack>
    </Box>
  );
};

export default ExerciseVideos;