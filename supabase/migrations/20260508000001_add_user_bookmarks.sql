-- Create user_bookmarks table for persistent bookmarks/flagged problems
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, problem_id)
);

-- Enable RLS
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for user_bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can view their own bookmarks"
  ON public.user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can insert their own bookmarks"
  ON public.user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
  ON public.user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_problem_id ON public.user_bookmarks(problem_id);

-- Add cf_handle to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cf_handle TEXT;
