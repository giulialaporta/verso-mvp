-- 1. Fix profiles UPDATE policy: add WITH CHECK to prevent sensitive field modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_pro IS NOT DISTINCT FROM (SELECT p.is_pro FROM public.profiles p WHERE p.user_id = auth.uid())
    AND free_apps_used IS NOT DISTINCT FROM (SELECT p.free_apps_used FROM public.profiles p WHERE p.user_id = auth.uid())
    AND pro_since IS NOT DISTINCT FROM (SELECT p.pro_since FROM public.profiles p WHERE p.user_id = auth.uid())
    AND pro_expires_at IS NOT DISTINCT FROM (SELECT p.pro_expires_at FROM public.profiles p WHERE p.user_id = auth.uid())
    AND stripe_customer_id IS NOT DISTINCT FROM (SELECT p.stripe_customer_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT p.stripe_subscription_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 2. Fix storage policies: change role from public to authenticated for cv-uploads
DROP POLICY IF EXISTS "Users can view own CVs" ON storage.objects;
CREATE POLICY "Users can view own CVs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cv-uploads' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own CVs" ON storage.objects;
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-uploads' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own CVs" ON storage.objects;
CREATE POLICY "Users can delete own CVs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cv-uploads' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Fix storage policies: change role from public to authenticated for cv-exports
DROP POLICY IF EXISTS "Users can view own CV exports" ON storage.objects;
CREATE POLICY "Users can view own CV exports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cv-exports' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own CV exports" ON storage.objects;
CREATE POLICY "Users can upload own CV exports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cv-exports' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own CV exports" ON storage.objects;
CREATE POLICY "Users can delete own CV exports" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cv-exports' AND (auth.uid())::text = (storage.foldername(name))[1]);