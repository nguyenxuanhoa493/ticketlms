-- Allow admins to update and delete all templates
-- Currently only the creator can update/delete their templates
-- This migration extends permissions to allow admins to manage all templates

-- Drop existing UPDATE policy for templates
DROP POLICY IF EXISTS "Users can update their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Admins can update all templates, users can update their own" ON api_request_templates;

-- Create new UPDATE policy allowing admins to update all templates
CREATE POLICY "Admins can update all templates, users can update their own"
    ON api_request_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

-- Drop existing DELETE policy for templates
DROP POLICY IF EXISTS "Users can delete their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Admins can delete all templates, users can delete their own" ON api_request_templates;

-- Create new DELETE policy allowing admins to delete all templates
CREATE POLICY "Admins can delete all templates, users can delete their own"
    ON api_request_templates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

-- Similarly update folders policies
DROP POLICY IF EXISTS "Users can update their own folders" ON api_template_folders;
DROP POLICY IF EXISTS "Admins can update all folders, users can update their own" ON api_template_folders;

CREATE POLICY "Admins can update all folders, users can update their own"
    ON api_template_folders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Users can delete their own folders" ON api_template_folders;
DROP POLICY IF EXISTS "Admins can delete all folders, users can delete their own" ON api_template_folders;

CREATE POLICY "Admins can delete all folders, users can delete their own"
    ON api_template_folders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
        OR created_by = auth.uid()
    );

-- Add comment
COMMENT ON POLICY "Admins can update all templates, users can update their own" ON api_request_templates 
    IS 'Allows admins to update any template, regular users can only update their own';

COMMENT ON POLICY "Admins can delete all templates, users can delete their own" ON api_request_templates 
    IS 'Allows admins to delete any template, regular users can only delete their own';
