-- Phase 1: Outfit Inspiration with Product Tagging
-- Create tables for social outfit sharing with product tagging

-- Outfit inspiration posts table
CREATE TABLE IF NOT EXISTS outfit_inspiration_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  style_tags TEXT[] DEFAULT '{}',
  occasion_tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product tags on inspiration posts (hotspots)
CREATE TABLE IF NOT EXISTS inspiration_product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id UUID REFERENCES outfit_inspiration_posts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  x_position DECIMAL(5,2) NOT NULL, -- Percentage position on image (0-100)
  y_position DECIMAL(5,2) NOT NULL, -- Percentage position on image (0-100)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions with inspiration posts
CREATE TABLE IF NOT EXISTS inspiration_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inspiration_id UUID REFERENCES outfit_inspiration_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, inspiration_id, interaction_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_user_id ON outfit_inspiration_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_public ON outfit_inspiration_posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_created_at ON outfit_inspiration_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_tags_inspiration ON inspiration_product_tags(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_inspiration ON inspiration_interactions(user_id, inspiration_id);

-- Row Level Security
ALTER TABLE outfit_inspiration_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_interactions ENABLE ROW LEVEL SECURITY;

-- Added proper policy existence checks to avoid duplicate policy errors
-- RLS Policies with existence checks
DO $$ 
BEGIN
  -- Public inspiration posts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_inspiration_posts' 
    AND policyname = 'Public inspiration posts are viewable by everyone'
  ) THEN
    CREATE POLICY "Public inspiration posts are viewable by everyone" ON outfit_inspiration_posts
      FOR SELECT USING (is_public = true);
  END IF;

  -- Users can view their own posts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_inspiration_posts' 
    AND policyname = 'Users can view their own inspiration posts'
  ) THEN
    CREATE POLICY "Users can view their own inspiration posts" ON outfit_inspiration_posts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can create posts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_inspiration_posts' 
    AND policyname = 'Users can create their own inspiration posts'
  ) THEN
    CREATE POLICY "Users can create their own inspiration posts" ON outfit_inspiration_posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update posts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_inspiration_posts' 
    AND policyname = 'Users can update their own inspiration posts'
  ) THEN
    CREATE POLICY "Users can update their own inspiration posts" ON outfit_inspiration_posts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Users can delete posts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'outfit_inspiration_posts' 
    AND policyname = 'Users can delete their own inspiration posts'
  ) THEN
    CREATE POLICY "Users can delete their own inspiration posts" ON outfit_inspiration_posts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Product tags policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_product_tags' 
    AND policyname = 'Product tags are viewable for public inspirations'
  ) THEN
    CREATE POLICY "Product tags are viewable for public inspirations" ON inspiration_product_tags
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM outfit_inspiration_posts 
          WHERE id = inspiration_id AND (is_public = true OR user_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_product_tags' 
    AND policyname = 'Users can add product tags to their own inspirations'
  ) THEN
    CREATE POLICY "Users can add product tags to their own inspirations" ON inspiration_product_tags
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM outfit_inspiration_posts 
          WHERE id = inspiration_id AND user_id = auth.uid()
        )
      );
  END IF;

  -- Interaction policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_interactions' 
    AND policyname = 'Users can view all interactions'
  ) THEN
    CREATE POLICY "Users can view all interactions" ON inspiration_interactions
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_interactions' 
    AND policyname = 'Users can create their own interactions'
  ) THEN
    CREATE POLICY "Users can create their own interactions" ON inspiration_interactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_interactions' 
    AND policyname = 'Users can delete their own interactions'
  ) THEN
    CREATE POLICY "Users can delete their own interactions" ON inspiration_interactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

END $$;
