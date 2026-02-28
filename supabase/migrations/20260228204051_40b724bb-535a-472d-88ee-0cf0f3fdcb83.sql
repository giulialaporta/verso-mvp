
CREATE TABLE public.job_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_hash TEXT NOT NULL UNIQUE,
  job_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read (job data is not sensitive)
CREATE POLICY "Anyone can read job cache"
ON public.job_cache FOR SELECT
USING (true);

-- Only service role can insert (edge function)
CREATE POLICY "Service role can insert job cache"
ON public.job_cache FOR INSERT
WITH CHECK (false);
