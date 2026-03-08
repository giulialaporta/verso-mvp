
-- US-S02: Recreate all RLS policies as PERMISSIVE (default)
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- ========== applications ==========
DROP POLICY IF EXISTS "Users can delete own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;

CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== master_cvs ==========
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.master_cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON public.master_cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON public.master_cvs;
DROP POLICY IF EXISTS "Users can view own CVs" ON public.master_cvs;

CREATE POLICY "Users can view own CVs" ON public.master_cvs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON public.master_cvs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON public.master_cvs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON public.master_cvs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== profiles ==========
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== tailored_cvs ==========
DROP POLICY IF EXISTS "Users can delete own tailored CVs" ON public.tailored_cvs;
DROP POLICY IF EXISTS "Users can insert own tailored CVs" ON public.tailored_cvs;
DROP POLICY IF EXISTS "Users can update own tailored CVs" ON public.tailored_cvs;
DROP POLICY IF EXISTS "Users can view own tailored CVs" ON public.tailored_cvs;

CREATE POLICY "Users can view own tailored CVs" ON public.tailored_cvs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tailored CVs" ON public.tailored_cvs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tailored CVs" ON public.tailored_cvs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tailored CVs" ON public.tailored_cvs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== job_cache ==========
DROP POLICY IF EXISTS "Anyone can read job cache" ON public.job_cache;
DROP POLICY IF EXISTS "Service role can insert job cache" ON public.job_cache;

CREATE POLICY "Anyone can read job cache" ON public.job_cache FOR SELECT USING (true);
CREATE POLICY "Service role can insert job cache" ON public.job_cache FOR INSERT WITH CHECK (false);
