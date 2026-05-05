-- Add detailed statistics columns to submissions table
ALTER TABLE submissions
ADD COLUMN test_case integer,
ADD COLUMN time_ms integer,
ADD COLUMN memory_kb integer;

-- Update existing records to have null values (already default)
