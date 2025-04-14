import React from 'react';
import { Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './HeroBanner.css';
import { FaTrophy, FaFire } from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';

const HeroBanner = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaFire />,
      title: 'Daily Challenges',
      description: 'Complete daily workouts to earn XP and climb the leaderboard',
      xp: '+100 XP'
    },
    {
      icon: <FaTrophy />,
      title: 'Achievement System',
      description: 'Unlock badges and rewards as you reach new fitness milestones',
      xp: '+500 XP'
    },
    {
      icon: <GiMuscleUp />,
      title: 'Power-Ups',
      description: 'Boost your progress with special workout multipliers',
      xp: '+200 XP'
    }
  ];

  const levels = [
    { icon: '1', title: 'Novice', description: '0-1000 XP' },
    { icon: '2', title: 'Warrior', description: '1000-5000 XP' },
    { icon: '3', title: 'Elite', description: '5000-10000 XP' },
    { icon: '4', title: 'Legend', description: '10000+ XP' }
  ];

  return (
    <>
      <section className="hero-section">
        <div className="animated-bg" />
        <div className="hero-content">
          <Typography variant="h1" className="hero-title">
            Level Up Your <span className="gradient-text">Fitness Journey</span>
          </Typography>
          <Typography variant="h2" className="hero-subtitle">
            Transform Your Workouts into Epic Quests
          </Typography>
          <Typography variant="body1" className="hero-description">
            Join our gamified fitness experience. Complete challenges,
            earn XP, unlock achievements, and compete with others while achieving your fitness goals.
          </Typography>

          <div className="hero-buttons">
            <Button
              variant="contained"
              className="btn-primary"
              onClick={() => navigate('/auth')}
            >
              Start Your Quest
            </Button>
            <Button
              variant="outlined"
              className="btn-secondary"
              onClick={() => navigate('/workouts')}
            >
              View Workouts
            </Button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <Typography variant="h2" className="section-title">
          Game-Changing Features
        </Typography>
        <div className="game-features">
          {features.map((feature, index) => (
            <div key={index} className="game-feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="xp-badge">{feature.xp}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="progression-section">
        <Typography variant="h2" className="section-title">
          Your Path to Glory
        </Typography>
        <div className="level-progression">
          {levels.map((level, index) => (
            <React.Fragment key={index}>
              {index > 0 && <div className="progression-arrow">→</div>}
              <div className="level-card">
                <div className="level-icon">{level.icon}</div>
                <h3>{level.title}</h3>
                <p>{level.description}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <Typography variant="h2" className="cta-title">
            Ready to Begin Your Adventure?
          </Typography>
          <Typography variant="body1" className="cta-description">
            Choose your path and start earning XP today.
            Join our community of fitness warriors!
          </Typography>
          <Button
            variant="contained"
            className="btn-primary cta-button"
            onClick={() => navigate('/auth')}
          >
            Start Your Journey
          </Button>
        </div>
      </section>
    </>
  );
};

export default HeroBanner;
