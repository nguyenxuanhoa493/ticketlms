-- Create Storage Policies Only
-- Run this after manually creating the bucket in Supabase Dashboard

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Step 2: Create policies for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Step 3: Create policies for authenticated users to update their files
CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Step 4: Create policies for public read access (so images can be viewed)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-attachments');

-- Step 5: Create policies for users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Verify the policies were created
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname = 'Allow authenticated users to upload' THEN '✅'
        WHEN policyname = 'Allow authenticated users to update' THEN '✅'
        WHEN policyname = 'Allow public read access' THEN '✅'
        WHEN policyname = 'Allow users to delete own files' THEN '✅'
        ELSE '❌'
    END as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname IN (
    'Allow authenticated users to upload',
    'Allow authenticated users to update', 
    'Allow public read access',
    'Allow users to delete own files'
)
ORDER BY policyname;
