-- Update RLS policies to allow admins to view all templates and folders
-- This aligns with the API comment: "Fetch all templates (public for all admins)"

-- Drop existing policies if they exist (either old name or new name)
DROP POLICY IF EXISTS "Users can view their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Admins can view all templates, users can view their own" ON api_request_templates;
DROP POLICY IF EXISTS "Users can view their own folders" ON api_template_folders;
DROP POLICY IF EXISTS "Admins can view all folders, users can view their own" ON api_template_folders;

-- Recreate SELECT policies with admin access
-- Templates: Admins can view all templates, non-admins can only view their own
CREATE POLICY "Admins can view all templates, users can view their own"
    ON api_request_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

-- Folders: Admins can view all folders, non-admins can only view their own
CREATE POLICY "Admins can view all folders, users can view their own"
    ON api_template_folders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

-- Note: Keep insert/update/delete policies as-is since users should still only modify their own resources
-- (The API endpoints already handle the permission logic for modifications)
