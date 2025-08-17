-- Fix storage bucket policies for inspiration images
-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create proper RLS policies for the images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
