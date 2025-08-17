-- Drop all existing problematic RLS policies and create simple, working ones
-- Drop all existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Disable RLS temporarily to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for other tables that might have issues
-- Fix outfit_inspirations policies
DROP POLICY IF EXISTS "Users can view public inspirations" ON outfit_inspirations;
DROP POLICY IF EXISTS "Users can manage own inspirations" ON outfit_inspirations;

ALTER TABLE outfit_inspirations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspirations_select_policy" ON outfit_inspirations
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "inspirations_insert_policy" ON outfit_inspirations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inspirations_update_policy" ON outfit_inspirations
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix outfit_inspiration_items policies
DROP POLICY IF EXISTS "Users can manage inspiration items" ON outfit_inspiration_items;

ALTER TABLE outfit_inspiration_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspiration_items_select_policy" ON outfit_inspiration_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
            AND (outfit_inspirations.is_public = true OR outfit_inspirations.user_id = auth.uid())
        )
    );

CREATE POLICY "inspiration_items_insert_policy" ON outfit_inspiration_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
            AND outfit_inspirations.user_id = auth.uid()
        )
    );

CREATE POLICY "inspiration_items_update_policy" ON outfit_inspiration_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations 
            WHERE outfit_inspirations.id = outfit_inspiration_items.inspiration_id 
            AND outfit_inspirations.user_id = auth.uid()
        )
    );

-- Fix orders policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_policy" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix cart_items policies
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;

CREATE POLICY "cart_items_select_policy" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_items_insert_policy" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_items_update_policy" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_items_delete_policy" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure products table allows public read access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "products_select_policy" ON products
    FOR SELECT USING (is_active = true);

-- Create a function to handle automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.user_profiles) = 0 THEN 'admin'
      ELSE 'user'
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the first user becomes admin
DO $$
BEGIN
  -- Update the first user to be admin if no admin exists
  UPDATE user_profiles 
  SET role = 'admin' 
  WHERE user_id = (
    SELECT user_id 
    FROM user_profiles 
    ORDER BY created_at ASC 
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE role = 'admin'
  );
END $$;

COMMIT;
