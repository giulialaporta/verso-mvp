-- Story 10: Add salary_expectations to profiles
ALTER TABLE public.profiles
ADD COLUMN salary_expectations jsonb DEFAULT NULL;

COMMENT ON COLUMN public.profiles.salary_expectations IS 'JSON: { current_ral: number|null, desired_ral: number|null }';
