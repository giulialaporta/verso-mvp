
-- Add new columns to applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS ats_score integer,
  ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'classico';

-- Add new columns to tailored_cvs
ALTER TABLE public.tailored_cvs
  ADD COLUMN IF NOT EXISTS ats_score integer,
  ADD COLUMN IF NOT EXISTS ats_checks jsonb,
  ADD COLUMN IF NOT EXISTS seniority_match jsonb,
  ADD COLUMN IF NOT EXISTS honest_score jsonb,
  ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'classico',
  ADD COLUMN IF NOT EXISTS diff jsonb;
