-- Create api_environments table
CREATE TABLE IF NOT EXISTS api_environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    host VARCHAR(500) NOT NULL,
    headers JSONB DEFAULT '{}',
    base_params JSONB DEFAULT '{}',
    user_code VARCHAR(100),
    pass_master TEXT,
    pass_root TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_environments_created_by ON api_environments(created_by);
CREATE INDEX IF NOT EXISTS idx_api_environments_is_active ON api_environments(is_active);
CREATE INDEX IF NOT EXISTS idx_api_environments_name ON api_environments(name);

-- Enable RLS
ALTER TABLE api_environments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view all environments" ON api_environments;
DROP POLICY IF EXISTS "Admin can insert environments" ON api_environments;
DROP POLICY IF EXISTS "Admin can update environments" ON api_environments;
DROP POLICY IF EXISTS "Admin can delete environments" ON api_environments;

-- Create RLS Policies (chỉ admin)
CREATE POLICY "Admin can view all environments"
    ON api_environments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert environments"
    ON api_environments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can update environments"
    ON api_environments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete environments"
    ON api_environments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_api_environments_updated_at ON api_environments;
CREATE TRIGGER update_api_environments_updated_at
    BEFORE UPDATE ON api_environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE api_environments IS 'API environments configuration for automation tools';
