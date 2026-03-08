ALTER TABLE public.tailored_cvs ADD COLUMN IF NOT EXISTS structural_changes jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS skills_overridden jsonb;