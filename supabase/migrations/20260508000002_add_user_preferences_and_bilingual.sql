-- Migration: Add user preferences, bilingual articles, problem translations, and Codeforces sync stats

-- 1. Profiles additions
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS hide_unsolved_tags BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS problems_view TEXT DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS cf_rating INTEGER,
  ADD COLUMN IF NOT EXISTS cf_rank TEXT,
  ADD COLUMN IF NOT EXISTS cf_max_rating INTEGER,
  ADD COLUMN IF NOT EXISTS cf_avatar TEXT,
  ADD COLUMN IF NOT EXISTS cf_last_synced_at TIMESTAMPTZ;

-- 2. Roadmap Topics bilingual support
ALTER TABLE public.roadmap_topics
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS article_markdown_en TEXT;

-- 3. Problems Russian localization support
ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS title_ru TEXT,
  ADD COLUMN IF NOT EXISTS description_ru TEXT;
