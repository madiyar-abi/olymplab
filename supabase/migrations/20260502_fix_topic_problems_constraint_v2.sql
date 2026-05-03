-- Migration: fix topic_problems unique constraint
-- Allow same problem to be linked to multiple topics.

ALTER TABLE topic_problems DROP CONSTRAINT IF EXISTS topic_problems_source_source_id_key;

ALTER TABLE topic_problems ADD CONSTRAINT topic_problems_topic_source_source_id_unique 
  UNIQUE (topic_id, source, source_id);
