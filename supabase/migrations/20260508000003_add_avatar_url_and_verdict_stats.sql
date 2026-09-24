-- Add avatar_url and cf_submissions_data to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cf_submissions_data JSONB DEFAULT '{}'::jsonb;

-- Ensure index on username for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
