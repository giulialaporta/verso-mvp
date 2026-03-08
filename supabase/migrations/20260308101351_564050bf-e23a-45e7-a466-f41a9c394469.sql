ALTER TABLE public.tailored_cvs ADD COLUMN IF NOT EXISTS score_note text;
ALTER TABLE public.tailored_cvs ADD COLUMN IF NOT EXISTS learning_suggestions jsonb;