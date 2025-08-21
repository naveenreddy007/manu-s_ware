-- Fix Image Upload and Storage System
-- This script ensures proper storage bucket setup and RLS policies

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create comprehensive storage policies for images bucket
CREATE POLICY "Users can upload images to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure outfit_inspiration_items table has proper structure for multiple images
ALTER TABLE outfit_inspiration_items 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'product';

-- Update existing records to have proper item_type
UPDATE outfit_inspiration_items 
SET item_type = 'product' 
WHERE item_type IS NULL AND product_id IS NOT NULL;

UPDATE outfit_inspiration_items 
SET item_type = 'image' 
WHERE item_type IS NULL AND product_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_outfit_inspiration_items_inspiration_id ON outfit_inspiration_items(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_outfit_inspiration_items_type ON outfit_inspiration_items(item_type);

-- Ensure outfit_inspirations table supports additional images
ALTER TABLE outfit_inspirations 
ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}';

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Image upload and storage system has been successfully configured';
END $$;
