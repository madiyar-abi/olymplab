-- Migration: add tags to problems table
-- This allows for global filtering of problems by algorithm tags.
--
-- Run this in your Supabase SQL Editor.

-- 1. Add tags column
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Backfill tags from topic_problems
-- This gathers all distinct tags from all topics a problem belongs to.
WITH problem_tags AS (
  SELECT problem_id, array_agg(DISTINCT tag) as all_tags
  FROM topic_problems, unnest(tags) as tag
  WHERE problem_id IS NOT NULL
  GROUP BY problem_id
)
UPDATE problems p
SET tags = pt.all_tags
FROM problem_tags pt
WHERE p.id = pt.problem_id;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_problems_tags ON public.problems USING GIN (tags);

-- 4. (Optional) Update ingestion scripts to populate this column directly.
-- The parsing team should update their scripts to insert into problems(tags) as well.
