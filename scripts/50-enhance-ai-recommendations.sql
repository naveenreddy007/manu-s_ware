-- Enhanced AI Recommendations and Outfit Planner Database Schema

-- Ensure outfits table exists with proper structure
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  occasion VARCHAR(100) DEFAULT 'casual',
  season VARCHAR(50) DEFAULT 'all-season',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure outfit_items table exists
CREATE TABLE IF NOT EXISTS outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('wardrobe', 'product')),
  item_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_occasion ON outfits(occasion);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_item_type_id ON outfit_items(item_type, item_id);

-- Enhanced RLS policies for outfits
DROP POLICY IF EXISTS "Users can manage their own outfits" ON outfits;
CREATE POLICY "Users can manage their own outfits" ON outfits
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own outfit items" ON outfit_items;
CREATE POLICY "Users can manage their own outfit items" ON outfit_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outfits 
      WHERE outfits.id = outfit_items.outfit_id 
      AND outfits.user_id = auth.uid()
    )
  );

-- Enable RLS
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

-- Add recommendation tracking table
CREATE TABLE IF NOT EXISTS recommendation_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('product', 'outfit')),
  item_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'like', 'add_to_cart', 'purchase')),
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_interactions_user_id ON recommendation_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_interactions_type ON recommendation_interactions(recommendation_type);

-- RLS for recommendation interactions
DROP POLICY IF EXISTS "Users can manage their own recommendation interactions" ON recommendation_interactions;
CREATE POLICY "Users can manage their own recommendation interactions" ON recommendation_interactions
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE recommendation_interactions ENABLE ROW LEVEL SECURITY;

-- Update wardrobe_items table to include tags for better recommendations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wardrobe_items' AND column_name = 'tags') THEN
    ALTER TABLE wardrobe_items ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wardrobe_items' AND column_name = 'style') THEN
    ALTER TABLE wardrobe_items ADD COLUMN style VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wardrobe_items' AND column_name = 'occasion') THEN
    ALTER TABLE wardrobe_items ADD COLUMN occasion VARCHAR(100);
  END IF;
END $$;

-- Update products table to include tags for better recommendations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'style') THEN
    ALTER TABLE products ADD COLUMN style VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'occasion') THEN
    ALTER TABLE products ADD COLUMN occasion VARCHAR(100);
  END IF;
END $$;

-- Create indexes for recommendation performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_tags ON wardrobe_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_style ON wardrobe_items(style);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_occasion ON wardrobe_items(occasion);

CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_style ON products(style);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON products(occasion);

-- Wrapped RAISE statement in DO block to fix PostgreSQL syntax error
DO $$
BEGIN
  RAISE NOTICE 'Enhanced AI Recommendations and Outfit Planner database schema completed successfully!';
END $$;
