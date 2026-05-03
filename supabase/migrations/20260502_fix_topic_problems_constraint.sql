
-- Update unique constraint on topic_problems to allow same problem in multiple topics
ALTER TABLE topic_problems DROP CONSTRAINT IF EXISTS topic_problems_source_source_id_key;

-- Add new composite unique constraint
ALTER TABLE topic_problems ADD CONSTRAINT topic_problems_topic_source_id_unique UNIQUE (topic_id, source, source_id);
