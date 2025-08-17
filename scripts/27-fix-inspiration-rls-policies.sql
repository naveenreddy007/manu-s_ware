-- Fix RLS policies for outfit inspiration items
-- Adding proper RLS policies for outfit_inspiration_items table

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspiration_items' AND policyname = 'Users can insert their own inspiration items') THEN
        DROP POLICY "Users can insert their own inspiration items" ON outfit_inspiration_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspiration_items' AND policyname = 'Users can view all inspiration items') THEN
        DROP POLICY "Users can view all inspiration items" ON outfit_inspiration_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspiration_items' AND policyname = 'Users can update their own inspiration items') THEN
        DROP POLICY "Users can update their own inspiration items" ON outfit_inspiration_items;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspiration_items' AND policyname = 'Users can delete their own inspiration items') THEN
        DROP POLICY "Users can delete their own inspiration items" ON outfit_inspiration_items;
    END IF;
END $$;

-- Enable RLS on outfit_inspiration_items
ALTER TABLE outfit_inspiration_items ENABLE ROW LEVEL SECURITY;

-- Fixed column references to use correct table and column names from schema
-- Create proper RLS policies
CREATE POLICY "Users can insert their own inspiration items" ON outfit_inspiration_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE id = outfit_inspiration_items.inspiration_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view all inspiration items" ON outfit_inspiration_items
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own inspiration items" ON outfit_inspiration_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE id = outfit_inspiration_items.inspiration_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own inspiration items" ON outfit_inspiration_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE id = outfit_inspiration_items.inspiration_id 
            AND user_id = auth.uid()
        )
    );

-- Fixed table name to use correct outfit_inspirations table
-- Also fix outfit_inspirations policies if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspirations' AND policyname = 'Users can insert their own posts') THEN
        CREATE POLICY "Users can insert their own posts" ON outfit_inspirations
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspirations' AND policyname = 'Users can view all posts') THEN
        CREATE POLICY "Users can view all posts" ON outfit_inspirations
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspirations' AND policyname = 'Users can update their own posts') THEN
        CREATE POLICY "Users can update their own posts" ON outfit_inspirations
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_inspirations' AND policyname = 'Users can delete their own posts') THEN
        CREATE POLICY "Users can delete their own posts" ON outfit_inspirations
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;
