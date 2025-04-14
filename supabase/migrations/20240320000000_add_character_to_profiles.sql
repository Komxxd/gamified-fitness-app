-- Add character field to profiles table
ALTER TABLE profiles
ADD COLUMN character JSONB DEFAULT NULL;

-- Add comment to explain the character field
COMMENT ON COLUMN profiles.character IS 'Stores the selected character data including grid position and name'; 