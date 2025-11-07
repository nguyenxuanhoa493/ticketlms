-- Create organization_activities table for activity logging
CREATE TABLE IF NOT EXISTS organization_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'created', 'updated', 'status_changed', 'admin_assigned', 
        'note_added', 'todo_added', 'todo_completed', 'custom'
    )),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_org_activities_org_id ON organization_activities(organization_id);
CREATE INDEX idx_org_activities_created_at ON organization_activities(created_at DESC);
CREATE INDEX idx_org_activities_type ON organization_activities(activity_type);

-- Enable RLS
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

-- Policies: Admin full access, others can only read their organization's activities
CREATE POLICY "Admins can manage all activities"
    ON organization_activities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their organization's activities"
    ON organization_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = organization_activities.organization_id
        )
    );

-- Auto-update updated_at timestamp
CREATE TRIGGER update_organization_activities_updated_at
    BEFORE UPDATE ON organization_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
