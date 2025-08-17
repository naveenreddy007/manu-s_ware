-- Fix infinite recursion in user_profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Create simple, non-recursive RLS policies for user_profiles
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "admin_user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Allow admins to update any profile
CREATE POLICY "admin_user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fix other tables that might have similar issues
-- Fix cart_items policies
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "cart_items_policy" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Fix orders policies  
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix wishlist policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
CREATE POLICY "wishlist_policy" ON wishlist
    FOR ALL USING (auth.uid() = user_id);

-- Fix outfit_inspirations policies
DROP POLICY IF EXISTS "Users can manage own inspirations" ON outfit_inspirations;
CREATE POLICY "inspirations_select_policy" ON outfit_inspirations
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "inspirations_insert_policy" ON outfit_inspirations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inspirations_update_policy" ON outfit_inspirations
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix outfit_inspiration_items policies
DROP POLICY IF EXISTS "Users can manage inspiration items" ON outfit_inspiration_items;
CREATE POLICY "inspiration_items_policy" ON outfit_inspiration_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM outfit_inspirations oi 
            WHERE oi.id = outfit_inspiration_items.inspiration_id 
            AND oi.user_id = auth.uid()
        )
    );
