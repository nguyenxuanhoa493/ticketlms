-- Simple Storage Setup for TicketLMS
-- This script only creates the bucket and policies without modifying table structure

-- Step 1: Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ticket-attachments',
    'ticket-attachments',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Step 3: Create policies for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Step 4: Create policies for authenticated users to update their files
CREATE POLICY "Allow authenticated users to update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Step 5: Create policies for public read access (so images can be viewed)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-attachments');

-- Step 6: Create policies for users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'ticket-attachments' 
    AND auth.role() = 'authenticated'
);

-- Verify the setup
DO $$
BEGIN
    -- Check if bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'ticket-attachments') THEN
        RAISE NOTICE '✅ Bucket ticket-attachments created successfully';
    ELSE
        RAISE NOTICE '❌ Failed to create bucket ticket-attachments';
    END IF;

    -- Check if policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Allow authenticated users to upload'
    ) THEN
        RAISE NOTICE '✅ Upload policy created successfully';
    ELSE
        RAISE NOTICE '❌ Upload policy not found';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Allow public read access'
    ) THEN
        RAISE NOTICE '✅ Read policy created successfully';
    ELSE
        RAISE NOTICE '❌ Read policy not found';
    END IF;

END $$;
