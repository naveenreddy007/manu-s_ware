-- Fixed script to work with actual user_profiles table structure (removed email column)
-- Fix admin user with correct email address
-- First, ensure the user profile exists and has admin role
INSERT INTO user_profiles (
  user_id,
  role,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'admin',
  NOW(),
  NOW()
FROM auth.users au 
WHERE au.email = 'uscl.bilvalabs@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Also update the auth metadata to ensure consistency
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'uscl.bilvalabs@gmail.com';
