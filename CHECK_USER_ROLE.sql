-- Run this in Supabase SQL Editor to check your user's role

-- 1. Check current user's profile
SELECT 
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at
FROM profiles 
WHERE email = 'hoanx@vieted.com';

-- 2. If role is NOT 'admin', update it:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'hoanx@vieted.com';

-- 3. Verify the update:
SELECT 
    id,
    email,
    full_name,
    role,
    organization_id
FROM profiles 
WHERE email = 'hoanx@vieted.com';

-- 4. Also check auth.users to ensure user exists:
SELECT 
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at
FROM auth.users 
WHERE email = 'hoanx@vieted.com';

-- Expected result:
-- email: hoanx@vieted.com
-- role: admin  <-- MUST BE 'admin'
-- full_name: Hòa VE
