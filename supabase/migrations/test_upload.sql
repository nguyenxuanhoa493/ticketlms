-- Test Upload Permissions
-- This script tests if the storage setup is working correctly

-- Check if bucket exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ticket-attachments') 
        THEN '✅ Bucket exists'
        ELSE '❌ Bucket missing'
    END as bucket_status;

-- Check if policies exist
SELECT 
    policyname,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Upload allowed'
        WHEN cmd = 'SELECT' THEN '✅ Read allowed'
        WHEN cmd = 'UPDATE' THEN '✅ Update allowed'
        WHEN cmd = 'DELETE' THEN '✅ Delete allowed'
        ELSE '❌ Unknown'
    END as permission_status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND bucket_id = 'ticket-attachments'
ORDER BY policyname;

-- Check current user permissions
SELECT 
    current_user as current_user,
    session_user as session_user,
    auth.role() as auth_role;

-- Test if we can see the bucket
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'ticket-attachments';
