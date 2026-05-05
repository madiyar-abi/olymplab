-- Add detailed statistics columns to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS test_case integer,
ADD COLUMN IF NOT EXISTS time_ms integer,
ADD COLUMN IF NOT EXISTS memory_kb integer;

-- Update existing records to have null values (already default)
