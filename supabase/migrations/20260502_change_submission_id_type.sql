-- Change cf_submission_id from BIGINT to TEXT
ALTER TABLE public.submissions 
ALTER COLUMN cf_submission_id TYPE TEXT USING cf_submission_id::TEXT;
