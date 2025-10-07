-- Phase 4: Storage Setup
-- Create storage bucket for PDF files and configure policies

-- Create the 'pdfs' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow authenticated users to upload their own PDFs
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Allow authenticated users to read their own PDFs
CREATE POLICY "Users can read their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Allow authenticated users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy: Allow service role to access all PDFs (for Edge Functions)
CREATE POLICY "Service role can access all PDFs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'pdfs');
