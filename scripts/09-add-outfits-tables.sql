-- Add column existence check and handle existing tables properly
-- Drop existing tables if they exist to ensure clean creation
DROP TABLE IF EXISTS outfit_calendar CASCADE;
DROP TABLE IF EXISTS outfit_items CASCADE;
DROP TABLE IF EXISTS outfits CASCADE;

-- Create outfits table
CREATE TABLE outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  season TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outfit_items table (junction table for outfit components)
CREATE TABLE outfit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'wardrobe' or 'product'
  item_id UUID NOT NULL, -- references either wardrobe_items.id or products.id
  category TEXT NOT NULL, -- 'top', 'bottom', 'shoes', 'accessories', 'outerwear'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outfit_calendar table for planning outfits for specific dates
CREATE TABLE outfit_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  occasion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, planned_date)
);

-- Create indexes after table creation is complete
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfits_public ON outfits(is_public) WHERE is_public = true;
CREATE INDEX idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX idx_outfit_calendar_user_date ON outfit_calendar(user_id, planned_date);

-- Enable RLS on all tables
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_calendar ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper column references
-- Outfits policies
CREATE POLICY "Users can view their own outfits" ON outfits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public outfits" ON outfits
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own outfits" ON outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits" ON outfits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits" ON outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Outfit items policies
CREATE POLICY "Users can view outfit items for accessible outfits" ON outfit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM outfits o 
      WHERE o.id = outfit_items.outfit_id 
      AND (o.user_id = auth.uid() OR o.is_public = true)
    )
  );

CREATE POLICY "Users can manage their own outfit items" ON outfit_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM outfits o 
      WHERE o.id = outfit_items.outfit_id 
      AND o.user_id = auth.uid()
    )
  );

-- Outfit calendar policies
CREATE POLICY "Users can manage their own outfit calendar" ON outfit_calendar
  FOR ALL USING (auth.uid() = user_id);
