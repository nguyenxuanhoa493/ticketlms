-- Check Storage Status for TicketLMS
-- This script checks the current status of storage bucket and policies

-- Check if bucket exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ticket-attachments') 
        THEN '✅ Bucket ticket-attachments exists'
        ELSE '❌ Bucket ticket-attachments does not exist'
    END as bucket_status;

-- Show bucket details if it exists
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE id = 'ticket-attachments';

-- Check if RLS is enabled on storage.objects
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
        ) THEN '✅ storage.objects table exists'
        ELSE '❌ storage.objects table does not exist'
    END as table_status;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- List all policies on storage.objects
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Check if required policies exist
SELECT 
    'Upload Policy' as policy_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
            AND policyname = 'Allow authenticated users to upload'
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
UNION ALL
SELECT 
    'Update Policy' as policy_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
            AND policyname = 'Allow authenticated users to update'
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
UNION ALL
SELECT 
    'Read Policy' as policy_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
            AND policyname = 'Allow public read access'
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
UNION ALL
SELECT 
    'Delete Policy' as policy_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'objects' 
            AND schemaname = 'storage'
            AND policyname = 'Allow users to delete own files'
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status;

-- Count existing files in bucket (if any)
SELECT 
    COUNT(*) as total_files,
    COUNT(CASE WHEN name LIKE 'avatars/%' THEN 1 END) as avatar_files,
    COUNT(CASE WHEN name LIKE 'images/%' THEN 1 END) as image_files
FROM storage.objects 
WHERE bucket_id = 'ticket-attachments';
