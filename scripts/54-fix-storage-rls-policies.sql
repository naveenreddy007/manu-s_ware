-- Fix storage bucket RLS policies to prevent violations
DO $$
BEGIN
    -- Drop existing storage policies if they exist
    DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
    DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
    
    -- Create proper storage policies
    CREATE POLICY "Users can upload images to their own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');
    
    CREATE POLICY "Users can update their own images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Users can delete their own images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    -- Ensure images bucket exists and is public
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('images', 'images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
    
    RAISE NOTICE 'Storage RLS policies fixed successfully';
END $$;
