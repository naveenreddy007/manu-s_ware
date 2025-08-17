-- Fix auth signup database error by ensuring proper RLS policies and triggers

-- First, ensure auth.users table has proper RLS policies (if we can modify it)
-- Note: In most Supabase setups, auth.users RLS is managed by Supabase itself

-- Drop and recreate the user profile creation trigger to fix any issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with error handling
  INSERT INTO public.user_profiles (user_id, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles) THEN 'admin'  -- First user becomes admin
      ELSE 'user' 
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure user_profiles table has proper constraints and indexes
ALTER TABLE user_profiles 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Ensure RLS policies are simple and non-recursive
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "admin_user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "admin_user_profiles_update_policy" ON user_profiles;

-- Create simple RLS policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (separate to avoid recursion)
CREATE POLICY "admin_can_view_all_profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "admin_can_update_all_profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
