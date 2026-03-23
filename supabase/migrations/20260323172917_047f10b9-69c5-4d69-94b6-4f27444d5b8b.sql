-- Fix paywall bypass: restrict which columns authenticated users can update on profiles
-- Service role (used by Stripe webhooks, check-subscription) is exempt from column grants

-- Revoke broad update right
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Grant only safe, user-editable columns
GRANT UPDATE (full_name, avatar_url, salary_expectations, updated_at)
  ON public.profiles TO authenticated;