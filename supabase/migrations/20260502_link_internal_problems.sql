-- Migration: add internal problem link to topic_problems
ALTER TABLE topic_problems ADD COLUMN IF NOT EXISTS problem_id uuid REFERENCES problems(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_topic_problems_internal_id ON topic_problems (problem_id);
