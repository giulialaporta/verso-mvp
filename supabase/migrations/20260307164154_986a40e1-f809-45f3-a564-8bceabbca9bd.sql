
-- Make cv-exports bucket private
UPDATE storage.buckets SET public = false WHERE id = 'cv-exports';

-- Drop the blanket public SELECT policy
DROP POLICY IF EXISTS "CV exports are publicly accessible" ON storage.objects;

-- Owner-scoped SELECT policy
CREATE POLICY "Users can view own CV exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cv-exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
