-- Creating idempotent script for RLS policies with DROP IF EXISTS
-- Fix RLS policies with proper cleanup and recreation

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
    -- Drop existing policies for user_profiles
    DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
    DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

    -- Create simple, non-recursive policies for user_profiles
    CREATE POLICY "user_profiles_select_policy" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "user_profiles_insert_policy" ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "user_profiles_update_policy" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "user_profiles_delete_policy" ON user_profiles
        FOR DELETE USING (auth.uid() = user_id);

    -- Drop and recreate policies for orders
    DROP POLICY IF EXISTS "orders_select_policy" ON orders;
    DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
    DROP POLICY IF EXISTS "orders_update_policy" ON orders;

    CREATE POLICY "orders_select_policy" ON orders
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "orders_insert_policy" ON orders
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "orders_update_policy" ON orders
        FOR UPDATE USING (auth.uid() = user_id);

    -- Drop and recreate policies for outfit_inspirations
    DROP POLICY IF EXISTS "inspirations_select_policy" ON outfit_inspirations;
    DROP POLICY IF EXISTS "inspirations_insert_policy" ON outfit_inspirations;
    DROP POLICY IF EXISTS "inspirations_update_policy" ON outfit_inspirations;
    DROP POLICY IF EXISTS "inspirations_delete_policy" ON outfit_inspirations;

    CREATE POLICY "inspirations_select_policy" ON outfit_inspirations
        FOR SELECT USING (is_public = true OR auth.uid() = user_id);
    
    CREATE POLICY "inspirations_insert_policy" ON outfit_inspirations
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "inspirations_update_policy" ON outfit_inspirations
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "inspirations_delete_policy" ON outfit_inspirations
        FOR DELETE USING (auth.uid() = user_id);

    -- Moved RAISE NOTICE inside the DO block to fix syntax error
    RAISE NOTICE 'RLS policies updated successfully';
END $$;

-- Enable RLS on tables if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create automatic user profile creation trigger if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'user', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Added final completion message in a separate DO block
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully';
END $$;
