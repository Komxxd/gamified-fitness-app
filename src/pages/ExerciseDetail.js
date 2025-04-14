import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, Stack, Grid, CircularProgress, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchExerciseById, exerciseOptions, youtubeOptions, fetchData } from '../utils/fetchData';
import { calculateExerciseXP } from '../utils/xpSystem';
import ExerciseCard from '../components/ExerciseCard';
import RoutineDialog from '../components/RoutineDialog';
import { useAuth } from '../contexts/AuthContext';
import LoadingFallback from '../components/LoadingFallback';
import './ExerciseDetail.css';

const ExerciseDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [exerciseDetail, setExerciseDetail] = useState(null);
  const [exerciseVideos, setExerciseVideos] = useState([]);
  const [similarTargetExercises, setSimilarTargetExercises] = useState([]);
  const [similarEquipmentExercises, setSimilarEquipmentExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExerciseData = async () => {
      setLoading(true);
      
      try {
        // Fetch exercise details
        let detail;
        if (location.state && location.state.exercise) {
          detail = location.state.exercise;
        } else {
          detail = await fetchExerciseById(id);
        }
        setExerciseDetail(detail);

        // Fetch exercise videos
      const youtubeSearchUrl = 'https://youtube-search-and-download.p.rapidapi.com';
        const videosData = await fetchData(`${youtubeSearchUrl}/search?query=${detail.name}`, youtubeOptions);
        setExerciseVideos(videosData.contents || []);

        // Fetch similar exercises
        const targetMuscleExercises = await fetchData(
          `https://exercisedb.p.rapidapi.com/exercises/target/${detail.target}`,
          exerciseOptions
        );
        setSimilarTargetExercises(targetMuscleExercises.filter(ex => ex.id !== detail.id).slice(0, 4));

        const equipmentExercises = await fetchData(
          `https://exercisedb.p.rapidapi.com/exercises/equipment/${detail.equipment}`,
          exerciseOptions
        );
        setSimilarEquipmentExercises(equipmentExercises.filter(ex => ex.id !== detail.id).slice(0, 4));
      } catch (error) {
        console.error('Error fetching exercise details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [id, location.state]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box className="exercise-detail-loading">
        <CircularProgress />
      </Box>
    );
  }

  if (!exerciseDetail) {
    return (
      <Box className="exercise-detail-error">
        <Typography variant="h5">
          Exercise not found. Please try again.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          className="back-button"
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box className="exercise-detail-container">
      <Button 
        variant="contained" 
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        className="back-button"
      >
        Back to Exercises
      </Button>

      <Grid container spacing={4} className="exercise-detail-content">
        <Grid item xs={12} md={6}>
          <Box className="exercise-image-container">
            <img 
              src={exerciseDetail.gifUrl} 
              alt={exerciseDetail.name} 
              className="exercise-detail-image"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box className="exercise-info">
            <Typography variant="h3" className="exercise-detail-name">
              {exerciseDetail.name}
            </Typography>

            <Typography variant="body1" className="exercise-detail-description">
              Exercises keep you strong. {exerciseDetail.name} is one of the best exercises to target your {exerciseDetail.target}. 
              It will help you improve your mood and gain energy.
            </Typography>

            <Stack direction="row" spacing={2} className="exercise-detail-chips">
              <Chip label={exerciseDetail.bodyPart} className="detail-chip bodypart" />
              <Chip label={exerciseDetail.target} className="detail-chip target" />
              <Chip label={exerciseDetail.equipment} className="detail-chip equipment" />
              <Tooltip 
                title={
                  <Typography variant="body2">
                    XP is calculated based on:
                    <br />• Equipment complexity (40%)
                    <br />• Target muscle group size (35%)
                    <br />• Body part involvement (25%)
                  </Typography>
                }
                arrow
                placement="top"
              >
                <Chip 
                  label={`${calculateExerciseXP(exerciseDetail)} XP`}
                  className="detail-chip xp"
                />
              </Tooltip>
            </Stack>

            <Box className="exercise-instructions">
              <Typography variant="h6" className="instructions-title">
                Instructions
              </Typography>
              <Box className="instructions-list">
                {exerciseDetail.instructions ? (
                  exerciseDetail.instructions.map((instruction, index) => (
                    <Typography key={index} variant="body2" className="instruction-step">
                      {index + 1}. {instruction}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">
                    1. Stand upright with a straight back and maintain good posture.
                    <br />
                    2. Perform the {exerciseDetail.name} with controlled movements.
                    <br />
                    3. Focus on the {exerciseDetail.target} muscle during the exercise.
                    <br />
                    4. Breathe steadily throughout the movement.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Exercise Videos Section */}
      <Box className="exercise-videos-section">
        <Typography variant="h4" className="section-title">
          Watch <span className="gradient-text">{exerciseDetail.name}</span> Exercise Videos
        </Typography>
        <Box className="videos-grid">
          {exerciseVideos?.slice(0, 3)?.map((item, index) => (
            <a
              key={index}
              className="video-card"
              href={`https://www.youtube.com/watch?v=${item.video.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              <img 
                src={item.video.thumbnails[0].url} 
                alt={item.video.title}
                className="video-thumbnail"
              />
              <Box className="video-content">
                <Typography variant="h6" className="video-title">
                  {item.video.title}
                </Typography>
                <Typography variant="body2" className="video-channel">
                  {item.video.channelName}
                </Typography>
              </Box>
            </a>
          ))}
        </Box>
      </Box>

      {/* Similar Exercises Section */}
      <Box className="similar-exercises-section">
        <Typography variant="h4" className="section-title">
          Similar <span className="gradient-text">Target Muscle</span> Exercises
        </Typography>
        <Grid container spacing={3}>
          {similarTargetExercises.map((exercise) => (
            <Grid item xs={12} sm={6} md={3} key={exercise.id}>
              <ExerciseCard 
                exercise={exercise}
                onClick={() => navigate(`/exercise/${exercise.id}`, { state: { exercise } })}
              />
            </Grid>
          ))}
        </Grid>

        <Typography variant="h4" className="section-title" sx={{ mt: 6 }}>
          Similar <span className="gradient-text">Equipment</span> Exercises
        </Typography>
        <Grid container spacing={3}>
          {similarEquipmentExercises.map((exercise) => (
            <Grid item xs={12} sm={6} md={3} key={exercise.id}>
              <ExerciseCard 
                exercise={exercise}
                onClick={() => navigate(`/exercise/${exercise.id}`, { state: { exercise } })}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default ExerciseDetail;