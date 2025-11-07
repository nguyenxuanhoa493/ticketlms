-- Create organization_todos table
CREATE TABLE IF NOT EXISTS organization_todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_org_todos_org_id ON organization_todos(organization_id);
CREATE INDEX idx_org_todos_status ON organization_todos(status);
CREATE INDEX idx_org_todos_priority ON organization_todos(priority);
CREATE INDEX idx_org_todos_due_date ON organization_todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_org_todos_assigned ON organization_todos(assigned_to) WHERE assigned_to IS NOT NULL;

-- Enable RLS
ALTER TABLE organization_todos ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage todos
CREATE POLICY "Admins can manage all todos"
    ON organization_todos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Auto-update updated_at timestamp
CREATE TRIGGER update_organization_todos_updated_at
    BEFORE UPDATE ON organization_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_todo_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organization_todos_completed_at
    BEFORE UPDATE ON organization_todos
    FOR EACH ROW
    EXECUTE FUNCTION set_todo_completed_at();
