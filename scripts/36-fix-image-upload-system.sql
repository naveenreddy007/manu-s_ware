-- Create the images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies that might be causing issues
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Create proper storage policies for the images bucket
CREATE POLICY "Public read access for images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload to images bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Fix outfit_inspiration_items table to support image storage
ALTER TABLE outfit_inspiration_items 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'product';

-- Update RLS policies for outfit_inspiration_items
DROP POLICY IF EXISTS "inspiration_items_policy" ON outfit_inspiration_items;

CREATE POLICY "inspiration_items_select_policy" ON outfit_inspiration_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations oi 
            WHERE oi.id = outfit_inspiration_items.inspiration_id 
            AND (oi.is_public = true OR oi.user_id = auth.uid())
        )
    );

CREATE POLICY "inspiration_items_insert_policy" ON outfit_inspiration_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM outfit_inspirations oi 
            WHERE oi.id = outfit_inspiration_items.inspiration_id 
            AND oi.user_id = auth.uid()
        )
    );

CREATE POLICY "inspiration_items_update_policy" ON outfit_inspiration_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations oi 
            WHERE oi.id = outfit_inspiration_items.inspiration_id 
            AND oi.user_id = auth.uid()
        )
    );

CREATE POLICY "inspiration_items_delete_policy" ON outfit_inspiration_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations oi 
            WHERE oi.id = outfit_inspiration_items.inspiration_id 
            AND oi.user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE outfit_inspiration_items ENABLE ROW LEVEL SECURITY;
