-- Add detailed statistics columns to submissions table
-- Note: This is a safe re-runnable version of the migration to ensure columns exist.
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS test_case integer;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS time_ms integer;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS memory_kb integer;

-- Commentary: These columns are used to store execution details for each submission,
-- such as which test case failed and the resources consumed (time and memory).
