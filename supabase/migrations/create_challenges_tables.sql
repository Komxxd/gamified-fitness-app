-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'weekly', 'tenDay', 'thirtyDay', 'steps'
  category VARCHAR(50), -- 'arms', 'chest', etc. for 30-day challenges
  days INTEGER, -- Number of days in the challenge
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_days table
CREATE TABLE IF NOT EXISTS challenge_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_exercises table
CREATE TABLE IF NOT EXISTS challenge_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_day_id UUID REFERENCES challenge_days(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration VARCHAR(50),
  step_goal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Create user_challenge_day_progress table
CREATE TABLE IF NOT EXISTS user_challenge_day_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_challenge_progress_id UUID REFERENCES user_challenge_progress(id) ON DELETE CASCADE,
  challenge_day_id UUID REFERENCES challenge_days(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  step_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_challenge_progress_id, challenge_day_id)
);

-- Create user_challenge_exercise_progress table
CREATE TABLE IF NOT EXISTS user_challenge_exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_challenge_day_progress_id UUID REFERENCES user_challenge_day_progress(id) ON DELETE CASCADE,
  challenge_exercise_id UUID REFERENCES challenge_exercises(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_challenge_day_progress_id, challenge_exercise_id)
);

-- Add RLS policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_day_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_exercise_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for challenges (everyone can view)
CREATE POLICY "Challenges are viewable by everyone" 
ON challenges FOR SELECT USING (true);

-- Create policies for challenge_days (everyone can view)
CREATE POLICY "Challenge days are viewable by everyone" 
ON challenge_days FOR SELECT USING (true);

-- Create policies for challenge_exercises (everyone can view)
CREATE POLICY "Challenge exercises are viewable by everyone" 
ON challenge_exercises FOR SELECT USING (true);

-- Create policies for user_challenge_progress (users can only view and modify their own)
CREATE POLICY "Users can view their own challenge progress" 
ON user_challenge_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" 
ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" 
ON user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge progress" 
ON user_challenge_progress FOR DELETE USING (auth.uid() = user_id);

-- Create policies for user_challenge_day_progress
CREATE POLICY "Users can view their own challenge day progress" 
ON user_challenge_day_progress FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM user_challenge_progress WHERE id = user_challenge_progress_id));

CREATE POLICY "Users can insert their own challenge day progress" 
ON user_challenge_day_progress FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM user_challenge_progress WHERE id = user_challenge_progress_id));

CREATE POLICY "Users can update their own challenge day progress" 
ON user_challenge_day_progress FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM user_challenge_progress WHERE id = user_challenge_progress_id));

CREATE POLICY "Users can delete their own challenge day progress" 
ON user_challenge_day_progress FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM user_challenge_progress WHERE id = user_challenge_progress_id));

-- Create policies for user_challenge_exercise_progress
CREATE POLICY "Users can view their own challenge exercise progress" 
ON user_challenge_exercise_progress FOR SELECT 
USING (
  auth.uid() = (
    SELECT user_id FROM user_challenge_progress 
    JOIN user_challenge_day_progress ON user_challenge_progress.id = user_challenge_day_progress.user_challenge_progress_id 
    WHERE user_challenge_day_progress.id = user_challenge_exercise_progress.user_challenge_day_progress_id
  )
);

CREATE POLICY "Users can insert their own challenge exercise progress" 
ON user_challenge_exercise_progress FOR INSERT 
WITH CHECK (
  auth.uid() = (
    SELECT user_id FROM user_challenge_progress 
    JOIN user_challenge_day_progress ON user_challenge_progress.id = user_challenge_day_progress.user_challenge_progress_id 
    WHERE user_challenge_day_progress.id = user_challenge_exercise_progress.user_challenge_day_progress_id
  )
);

CREATE POLICY "Users can update their own challenge exercise progress" 
ON user_challenge_exercise_progress FOR UPDATE 
USING (
  auth.uid() = (
    SELECT user_id FROM user_challenge_progress 
    JOIN user_challenge_day_progress ON user_challenge_progress.id = user_challenge_day_progress.user_challenge_progress_id 
    WHERE user_challenge_day_progress.id = user_challenge_exercise_progress.user_challenge_day_progress_id
  )
);

CREATE POLICY "Users can delete their own challenge exercise progress" 
ON user_challenge_exercise_progress FOR DELETE 
USING (
  auth.uid() = (
    SELECT user_id FROM user_challenge_progress 
    JOIN user_challenge_day_progress ON user_challenge_progress.id = user_challenge_day_progress.user_challenge_progress_id 
    WHERE user_challenge_day_progress.id = user_challenge_exercise_progress.user_challenge_day_progress_id
  )
);

-- Insert some default challenges
INSERT INTO challenges (name, description, type, days, total_xp)
VALUES ('Weekly Challenge', 'Complete these exercises every day for a full week to earn bonus XP!', 'weekly', 7, 700);

INSERT INTO challenges (name, description, type, days, total_xp)
VALUES ('10-Day HIIT Challenge', 'High-intensity interval training for quick results. Complete all 10 days!', 'tenDay', 10, 1000);

INSERT INTO challenges (name, description, type, category, days, total_xp)
VALUES ('30-Day Arms Challenge', 'Build stronger, more defined arms with this progressive 30-day program.', 'thirtyDay', 'arms', 30, 3000);

INSERT INTO challenges (name, description, type, category, days, total_xp)
VALUES ('30-Day Chest Challenge', 'Sculpt your pecs with progressive chest workouts', 'thirtyDay', 'chest', 30, 3000);

INSERT INTO challenges (name, description, type, days, total_xp)
VALUES ('15K Steps Challenge', 'Reach 15,000 steps daily for 15 days to boost your cardiovascular health!', 'steps', 15, 1500); 