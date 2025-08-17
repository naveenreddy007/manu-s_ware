-- Simplified bucket creation without storage policies that don't exist
-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies are not available in this Supabase setup
-- The bucket will use default permissions
