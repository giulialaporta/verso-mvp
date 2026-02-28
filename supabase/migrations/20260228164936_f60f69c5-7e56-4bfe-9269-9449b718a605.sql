
-- Create storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', false);

-- Users can upload their own CVs
CREATE POLICY "Users can upload own CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own CVs
CREATE POLICY "Users can view own CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own CVs
CREATE POLICY "Users can delete own CVs"
ON storage.objects FOR DELETE
USING (bucket_id = 'cv-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
