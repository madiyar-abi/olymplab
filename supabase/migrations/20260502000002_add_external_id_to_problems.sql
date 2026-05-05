-- Migration: add external_id to problems for easier ingestion
ALTER TABLE problems ADD COLUMN IF NOT EXISTS external_id text UNIQUE;

-- Optional: ensure title is unique if we want to upsert by title
-- ALTER TABLE problems ADD CONSTRAINT problems_title_unique UNIQUE (title);
