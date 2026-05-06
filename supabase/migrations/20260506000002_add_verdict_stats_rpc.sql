-- RPC to get verdict statistics for a user
CREATE OR REPLACE FUNCTION get_user_verdict_stats(p_user_id UUID)
RETURNS TABLE (
    verdict TEXT,
    count BIGINT,
    percentage DOUBLE PRECISION
) AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- Get total count of submissions for the user
    SELECT COUNT(*) INTO v_total_count
    FROM public.submissions
    WHERE user_id = p_user_id AND verdict IS NOT NULL;

    -- Return stats
    IF v_total_count = 0 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        s.verdict,
        COUNT(*),
        (COUNT(*)::DOUBLE PRECISION / v_total_count) * 100
    FROM public.submissions s
    WHERE s.user_id = p_user_id AND s.verdict IS NOT NULL
    GROUP BY s.verdict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
