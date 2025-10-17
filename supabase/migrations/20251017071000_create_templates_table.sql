-- Create api_request_templates table only
-- (api_template_folders already exists)

CREATE TABLE IF NOT EXISTS api_request_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    folder_id UUID REFERENCES api_template_folders(id) ON DELETE CASCADE,
    
    -- Request configuration
    environment_id UUID REFERENCES api_environments(id) ON DELETE SET NULL,
    path VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    payload JSONB DEFAULT '{}',
    dmn VARCHAR(100),
    user_code VARCHAR(100),
    password TEXT,
    
    -- Metadata
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Template name must be unique per folder per user
    CONSTRAINT unique_template_name_per_folder UNIQUE (created_by, folder_id, name)
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON api_request_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_folder_id ON api_request_templates(folder_id);
CREATE INDEX IF NOT EXISTS idx_templates_environment_id ON api_request_templates(environment_id);

-- Enable RLS for templates
ALTER TABLE api_request_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON api_request_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON api_request_templates;

-- Create RLS Policies for templates
CREATE POLICY "Users can view their own templates"
    ON api_request_templates FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own templates"
    ON api_request_templates FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
    ON api_request_templates FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
    ON api_request_templates FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_templates_updated_at ON api_request_templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON api_request_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE api_request_templates IS 'API request templates organized in folders';
