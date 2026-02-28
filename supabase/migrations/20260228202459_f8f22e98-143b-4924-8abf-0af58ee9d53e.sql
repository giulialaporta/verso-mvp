
ALTER TABLE public.master_cvs
  ADD COLUMN IF NOT EXISTS raw_text text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS photo_url text;
