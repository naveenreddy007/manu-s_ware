-- Add social sharing tracking
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'product', 'outfit', 'recommendation'
  item_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'pinterest', 'linkedin', 'copy'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Make outfits shareable publicly
ALTER TABLE outfits ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE outfits ADD COLUMN shared_at TIMESTAMP WITH TIME ZONE;

-- Create outfit likes table
CREATE TABLE IF NOT EXISTS outfit_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, outfit_id)
);

-- Add RLS policies
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_likes ENABLE ROW LEVEL SECURITY;

-- Social shares policies
CREATE POLICY "Users can view all social shares" ON social_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own social shares" ON social_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Outfit likes policies
CREATE POLICY "Users can view all outfit likes" ON outfit_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own outfit likes" ON outfit_likes
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_social_shares_item ON social_shares(item_type, item_id);
CREATE INDEX idx_social_shares_platform ON social_shares(platform);
CREATE INDEX idx_outfit_likes_outfit_id ON outfit_likes(outfit_id);
CREATE INDEX idx_outfits_public_shared ON outfits(is_public, shared_at) WHERE is_public = true;
