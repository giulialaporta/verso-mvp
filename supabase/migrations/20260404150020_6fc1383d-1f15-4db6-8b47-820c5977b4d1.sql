-- Block client-side DELETE on job_cache
CREATE POLICY "Block client delete on job_cache"
ON public.job_cache
FOR DELETE
TO public
USING (false);

-- Function to clean up expired job cache entries (> 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_expired_job_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.job_cache
  WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;