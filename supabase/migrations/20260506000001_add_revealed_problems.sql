-- Create revealed_problems table for persistent spoiler reveals
CREATE TABLE IF NOT EXISTS revealed_problems (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

-- Enable RLS
ALTER TABLE revealed_problems ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their own revealed problems"
  ON revealed_problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own revealed problems"
  ON revealed_problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);
