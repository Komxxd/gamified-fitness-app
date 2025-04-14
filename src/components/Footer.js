import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: '2rem',
        marginTop: 'auto',
        color: 'var(--text-color)',
        fontFamily: 'var(--font-secondary)',
        background: 'transparent'
      }}
    >
      <Typography
        sx={{
          fontSize: '1rem',
          opacity: 0.8,
          '& span': {
            color: 'var(--primary-color)',
            fontWeight: 600
          },
          '& a': {
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': {
              textDecoration: 'underline'
            }
          }
        }}
      >
        Created by{' '}
        <Link href="https://github.com/Komxxd" target="_blank" rel="noopener noreferrer">
          <span>Komal Kumari</span>
        </Link>
        ,{' '}
        <Link href="https://github.com/heheshreya" target="_blank" rel="noopener noreferrer">
          <span>Shreya Anand</span>
        </Link>
        ,{' '}
        <Link href="https://github.com/itzkritz" target="_blank" rel="noopener noreferrer">
          <span>Kritika Mishra</span>
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;