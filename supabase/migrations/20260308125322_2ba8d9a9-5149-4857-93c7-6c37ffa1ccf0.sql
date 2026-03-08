ALTER TABLE public.consent_logs ADD COLUMN user_hash text;
CREATE INDEX idx_consent_logs_user_hash ON public.consent_logs(user_hash);