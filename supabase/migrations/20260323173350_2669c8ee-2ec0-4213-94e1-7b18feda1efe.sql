-- Restore broad UPDATE grant (column-level grants alone caused issues)
GRANT UPDATE ON public.profiles TO authenticated;

-- Add a BEFORE UPDATE trigger to protect sensitive columns from non-service-role users
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role (used by Stripe webhooks, check-subscription) to update anything
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive fields
  IF NEW.is_pro IS DISTINCT FROM OLD.is_pro
     OR NEW.free_apps_used IS DISTINCT FROM OLD.free_apps_used
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.pro_since IS DISTINCT FROM OLD.pro_since
     OR NEW.pro_expires_at IS DISTINCT FROM OLD.pro_expires_at
  THEN
    RAISE EXCEPTION 'Non puoi modificare i campi di abbonamento direttamente.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();