-- Explicit deny policies for UPDATE and DELETE on consent_logs
CREATE POLICY "Deny update on consent_logs"
ON public.consent_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny delete on consent_logs"
ON public.consent_logs
FOR DELETE
TO authenticated
USING (false);