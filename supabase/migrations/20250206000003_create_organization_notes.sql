-- Create organization_notes table for admin notes
CREATE TABLE IF NOT EXISTS organization_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_org_notes_org_id ON organization_notes(organization_id);
CREATE INDEX idx_org_notes_created_at ON organization_notes(created_at DESC);
CREATE INDEX idx_org_notes_pinned ON organization_notes(is_pinned) WHERE is_pinned = TRUE;

-- Enable RLS
ALTER TABLE organization_notes ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage notes
CREATE POLICY "Admins can manage all notes"
    ON organization_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Auto-update updated_at timestamp
CREATE TRIGGER update_organization_notes_updated_at
    BEFORE UPDATE ON organization_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
