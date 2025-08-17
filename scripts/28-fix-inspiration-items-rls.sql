-- Fix RLS policies for outfit_inspiration_items table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own inspiration items" ON outfit_inspiration_items;
DROP POLICY IF EXISTS "Users can view all inspiration items" ON outfit_inspiration_items;
DROP POLICY IF EXISTS "Users can update their own inspiration items" ON outfit_inspiration_items;
DROP POLICY IF EXISTS "Users can delete their own inspiration items" ON outfit_inspiration_items;

-- Enable RLS on outfit_inspiration_items
ALTER TABLE outfit_inspiration_items ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
CREATE POLICY "Users can insert their own inspiration items" ON outfit_inspiration_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfit_inspirations 
      WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
      AND outfit_inspirations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view all inspiration items" ON outfit_inspiration_items
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own inspiration items" ON outfit_inspiration_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM outfit_inspirations 
      WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
      AND outfit_inspirations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own inspiration items" ON outfit_inspiration_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM outfit_inspirations 
      WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
      AND outfit_inspirations.user_id = auth.uid()
    )
  );
