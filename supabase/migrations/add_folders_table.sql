-- Optional: Create dedicated folders table for better management
-- Chỉ tạo nếu bạn muốn quản lý folders riêng biệt

CREATE TABLE IF NOT EXISTS api_template_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    folder_path TEXT NOT NULL, -- Full path: /users/admin
    parent_path TEXT, -- Parent path: /users
    
    -- Metadata
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Each user can have unique folder paths
    CONSTRAINT unique_folder_path_per_user UNIQUE (created_by, folder_path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON api_template_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_path ON api_template_folders(folder_path);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON api_template_folders(parent_path);

-- Enable RLS
ALTER TABLE api_template_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own folders"
    ON api_template_folders FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can create their own folders"
    ON api_template_folders FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own folders"
    ON api_template_folders FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own folders"
    ON api_template_folders FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_folders_updated_at ON api_template_folders;
CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON api_template_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE api_template_folders IS 'Folder structure for organizing API request templates';

-- Insert default root folder for existing users
-- (Run this after migration to create root folders)
-- INSERT INTO api_template_folders (name, folder_path, parent_path, created_by)
-- SELECT 'Root', '/', NULL, id FROM profiles
-- ON CONFLICT (created_by, folder_path) DO NOTHING;
