-- Migration: create topic_problems table
-- Stores practice problems from external platforms (Codeforces, CSES, AtCoder)
-- linked to our roadmap topics.
--
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS topic_problems (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        uuid        NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,

  -- External platform info
  source          text        NOT NULL CHECK (source IN ('codeforces', 'cses', 'atcoder')),
  source_id       text        NOT NULL,              -- e.g. "1234/A" for CF, "1068" for CSES
  title           text        NOT NULL,
  url             text        NOT NULL,

  -- Difficulty
  cf_rating       integer,                           -- only for Codeforces (900–3500)
  difficulty      text        NOT NULL DEFAULT 'medium'
                                CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Categorisation
  layer           text        NOT NULL DEFAULT 'core'
                                CHECK (layer IN ('intro', 'core', 'mixed')),
  tags            text[]      NOT NULL DEFAULT '{}', -- platform tags

  -- Stats (updated periodically)
  solved_count    integer,

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (source, source_id)  -- no duplicates across topics
);

-- Index for fast per-topic queries
CREATE INDEX IF NOT EXISTS idx_topic_problems_topic_id ON topic_problems (topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_problems_source   ON topic_problems (source);
CREATE INDEX IF NOT EXISTS idx_topic_problems_diff     ON topic_problems (cf_rating);

-- Enable RLS (read-only for authenticated users, full access via service role)
ALTER TABLE topic_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topic_problems_read" ON topic_problems
  FOR SELECT USING (true);
