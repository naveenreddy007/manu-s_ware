-- ======================================================
-- Outfit Inspiration System (Idempotent Version)
-- ======================================================

-- Create outfit inspirations table
CREATE TABLE IF NOT EXISTS outfit_inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outfit inspiration items (products featured in the outfit)
CREATE TABLE IF NOT EXISTS outfit_inspiration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id UUID REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  position_x DECIMAL(5,2),
  position_y DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inspiration likes
CREATE TABLE IF NOT EXISTS inspiration_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id UUID REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(inspiration_id, user_id)
);

-- Create inspiration saves
CREATE TABLE IF NOT EXISTS inspiration_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id UUID REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(inspiration_id, user_id)
);

-- Create affiliate tracking for inspiration purchases
CREATE TABLE IF NOT EXISTS inspiration_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspiration_id UUID REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create creator earnings tracking
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_withdrawals DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE outfit_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_inspiration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- Policies (idempotent using pg_policies check)
-- ======================================================

-- Helper: function to create policy only if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public inspirations are viewable by everyone' AND tablename = 'outfit_inspirations') THEN
    CREATE POLICY "Public inspirations are viewable by everyone" ON outfit_inspirations
      FOR SELECT USING (is_public = true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own inspirations' AND tablename = 'outfit_inspirations') THEN
    CREATE POLICY "Users can view their own inspirations" ON outfit_inspirations
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own inspirations' AND tablename = 'outfit_inspirations') THEN
    CREATE POLICY "Users can create their own inspirations" ON outfit_inspirations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own inspirations' AND tablename = 'outfit_inspirations') THEN
    CREATE POLICY "Users can update their own inspirations" ON outfit_inspirations
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own inspirations' AND tablename = 'outfit_inspirations') THEN
    CREATE POLICY "Users can delete their own inspirations" ON outfit_inspirations
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- outfit_inspiration_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Inspiration items are viewable by everyone' AND tablename = 'outfit_inspiration_items') THEN
    CREATE POLICY "Inspiration items are viewable by everyone" ON outfit_inspiration_items
      FOR SELECT USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage items for their inspirations' AND tablename = 'outfit_inspiration_items') THEN
    CREATE POLICY "Users can manage items for their inspirations" ON outfit_inspiration_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM outfit_inspirations 
          WHERE id = inspiration_id AND user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- inspiration_likes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all likes' AND tablename = 'inspiration_likes') THEN
    CREATE POLICY "Users can view all likes" ON inspiration_likes
      FOR SELECT USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own likes' AND tablename = 'inspiration_likes') THEN
    CREATE POLICY "Users can manage their own likes" ON inspiration_likes
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END$$;

-- inspiration_saves
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own saves' AND tablename = 'inspiration_saves') THEN
    CREATE POLICY "Users can view their own saves" ON inspiration_saves
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own saves' AND tablename = 'inspiration_saves') THEN
    CREATE POLICY "Users can manage their own saves" ON inspiration_saves
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END$$;

-- inspiration_purchases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view purchases they''re involved in' AND tablename = 'inspiration_purchases') THEN
    CREATE POLICY "Users can view purchases they're involved in" ON inspiration_purchases
      FOR SELECT USING (auth.uid() = creator_user_id OR auth.uid() = buyer_user_id);
  END IF;
END$$;

-- creator_earnings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own earnings' AND tablename = 'creator_earnings') THEN
    CREATE POLICY "Users can view their own earnings" ON creator_earnings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own earnings' AND tablename = 'creator_earnings') THEN
    CREATE POLICY "Users can update their own earnings" ON creator_earnings
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- ======================================================
-- Indexes
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_outfit_inspirations_user_id ON outfit_inspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_inspirations_public ON outfit_inspirations(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_inspiration_items_inspiration_id ON outfit_inspiration_items(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_inspiration_id ON inspiration_likes(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_saves_user_id ON inspiration_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_purchases_creator ON inspiration_purchases(creator_user_id);

-- ======================================================
-- Sample Data (idempotent)
-- ======================================================
INSERT INTO outfit_inspirations (user_id, title, description, image_url, tags, is_public)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'uscl.bilvalabs@gmail.com' LIMIT 1),
  'Modern Business Casual',
  'Perfect blend of professional and comfortable for the modern workplace',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop',
  '{"business casual", "professional", "modern", "comfortable"}',
  true
)
ON CONFLICT DO NOTHING;

INSERT INTO outfit_inspirations (user_id, title, description, image_url, tags, is_public)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'uscl.bilvalabs@gmail.com' LIMIT 1),
  'Weekend Street Style',
  'Effortless street style perfect for weekend adventures',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=600&fit=crop',
  '{"streetwear", "casual", "weekend", "urban"}',
  true
)
ON CONFLICT DO NOTHING;
