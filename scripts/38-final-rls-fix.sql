-- Final fix for infinite recursion in user_profiles RLS policies
-- The issue is that admin policies are checking user_profiles table while being evaluated on user_profiles table

-- Drop ALL existing policies on user_profiles to start fresh
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "admin_user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "admin_user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "admin_can_view_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admin_can_update_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create simple, non-recursive policies that only check auth.uid()
-- No admin checks to avoid recursion
CREATE POLICY "allow_own_profile_select" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_own_profile_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_own_profile_update" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- For admin functionality, we'll handle it in the application layer
-- instead of RLS policies to avoid recursion

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fix the trigger function to be more robust
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users to determine if this is the first user
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        user_id, 
        role, 
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        CASE WHEN user_count <= 1 THEN 'admin' ELSE 'user' END,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail auth signup if profile creation fails
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;
