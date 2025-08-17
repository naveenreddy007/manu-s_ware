-- Make the current authenticated user an admin
-- This script will work for any user currently logged in

DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID from auth.users (this will be the logged-in user)
    SELECT id INTO current_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        -- Insert or update user profile with admin role
        INSERT INTO user_profiles (user_id, role, first_name, last_name)
        VALUES (current_user_id, 'admin', 'Admin', 'User')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'User % has been granted admin privileges', current_user_id;
    ELSE
        RAISE NOTICE 'No user found to make admin';
    END IF;
END $$;
