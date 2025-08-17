-- Make the current user an admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'uscl.bilvalabs@gmail.com'
);

-- Removed email column reference and fixed INSERT to use only existing columns
-- If no user_profiles record exists, create one
INSERT INTO user_profiles (user_id, role, first_name, last_name)
SELECT 
  id, 
  'admin', 
  COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
  COALESCE(raw_user_meta_data->>'last_name', 'User')
FROM auth.users 
WHERE email = 'uscl.bilvalabs@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.users.id
  );
