-- Make uscl.bilavalabs@gmail.com an admin user
-- This script will create or update the user profile to have admin role

-- First, check if the user exists in auth.users and get their ID
DO $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Get the user ID from auth.users table
    SELECT id INTO user_id_var 
    FROM auth.users 
    WHERE email = 'uscl.bilavalabs@gmail.com';
    
    -- If user exists, create or update their profile
    IF user_id_var IS NOT NULL THEN
        -- Insert or update user profile with admin role
        INSERT INTO user_profiles (
            id, 
            role, 
            first_name, 
            last_name, 
            email,
            created_at,
            updated_at
        ) VALUES (
            user_id_var,
            'admin',
            'Admin',
            'User',
            'uscl.bilavalabs@gmail.com',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = 'admin',
            updated_at = NOW();
            
        RAISE NOTICE 'User uscl.bilavalabs@gmail.com has been granted admin access';
    ELSE
        RAISE NOTICE 'User uscl.bilavalabs@gmail.com not found in auth.users. Please sign up first.';
    END IF;
END $$;

-- Verify the admin user was created/updated
SELECT 
    up.id,
    up.email,
    up.role,
    up.first_name,
    up.last_name,
    au.email as auth_email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.email = 'uscl.bilavalabs@gmail.com';
