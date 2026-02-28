
-- Create cv-exports bucket for PDF storage
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-exports', 'cv-exports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to cv-exports
CREATE POLICY "Users can upload own CV exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cv-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for CV exports
CREATE POLICY "CV exports are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-exports');

-- Allow users to delete own CV exports
CREATE POLICY "Users can delete own CV exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'cv-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add pdf_url column to tailored_cvs
ALTER TABLE public.tailored_cvs ADD COLUMN IF NOT EXISTS pdf_url text;
