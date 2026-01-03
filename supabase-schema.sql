-- OTF Tracker Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_date DATE UNIQUE NOT NULL,
  treadmill_distance DECIMAL(4,2),
  rower_distance DECIMAL(6,0),
  splat_points INTEGER,
  calories INTEGER,
  email_subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_workout_date ON workouts(workout_date DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust as needed)
-- For a personal app, this simple policy works fine
CREATE POLICY "Allow all operations" ON workouts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to authenticated and anon users
GRANT ALL ON workouts TO anon;
GRANT ALL ON workouts TO authenticated;
