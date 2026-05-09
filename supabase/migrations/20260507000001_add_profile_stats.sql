-- Add solved_count and level to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS solved_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_solved_count INTEGER;
    v_level INTEGER;
BEGIN
    -- Count unique solved problems
    SELECT COUNT(DISTINCT problem_id) INTO v_solved_count
    FROM public.submissions
    WHERE user_id = NEW.user_id AND verdict IN ('Accepted', 'AC', 'OK', 'CORRECT');

    -- Calculate level (basic formula: 1 level per 5 solved problems)
    v_level := 1 + FLOOR(v_solved_count / 5);

    -- Update profile
    UPDATE public.profiles
    SET solved_count = v_solved_count,
        level = v_level
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on submission changes
DROP TRIGGER IF EXISTS trigger_update_profile_stats ON public.submissions;
CREATE TRIGGER trigger_update_profile_stats
    AFTER INSERT OR UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_stats();

-- Initial backfill for existing profiles
UPDATE public.profiles p
SET solved_count = (
    SELECT COUNT(DISTINCT problem_id)
    FROM public.submissions s
    WHERE s.user_id = p.id AND s.verdict IN ('Accepted', 'AC', 'OK', 'CORRECT')
);

UPDATE public.profiles
SET level = 1 + FLOOR(solved_count / 5);
