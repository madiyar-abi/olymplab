-- Migration: add rating column to problems and populate from topic_problems
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS rating INTEGER;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_problems_rating ON public.problems (rating);

-- Populate existing ratings from topic_problems
UPDATE public.problems p
SET rating = tp.cf_rating
FROM public.topic_problems tp
WHERE p.id = tp.problem_id AND tp.cf_rating IS NOT NULL;
