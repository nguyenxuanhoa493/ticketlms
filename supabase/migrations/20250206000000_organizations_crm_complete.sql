-- =====================================================
-- ORGANIZATIONS CRM - COMPLETE MIGRATION
-- Description: Add CRM features to organizations table
-- Date: 2025-02-06
-- =====================================================

-- ===========================================
-- 1. ADD CRM FIELDS TO ORGANIZATIONS
-- ===========================================

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_assigned_admin ON organizations(assigned_admin_id);

COMMENT ON COLUMN organizations.status IS 'Organization operational status: active, inactive, pending';
COMMENT ON COLUMN organizations.assigned_admin_id IS 'Admin user responsible for this organization';

-- ===========================================
-- 2. CREATE ORGANIZATION ACTIVITIES TABLE
-- ===========================================

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

CREATE INDEX IF NOT EXISTS idx_org_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_activities_created_at ON organization_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_activities_type ON organization_activities(activity_type);

ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all activities" ON organization_activities;
DROP POLICY IF EXISTS "Users can view their organization's activities" ON organization_activities;

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

DROP TRIGGER IF EXISTS update_organization_activities_updated_at ON organization_activities;
CREATE TRIGGER update_organization_activities_updated_at
    BEFORE UPDATE ON organization_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. CREATE ORGANIZATION NOTES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS organization_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_notes_org_id ON organization_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_notes_created_at ON organization_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_notes_pinned ON organization_notes(is_pinned) WHERE is_pinned = TRUE;

ALTER TABLE organization_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all notes" ON organization_notes;

CREATE POLICY "Admins can manage all notes"
    ON organization_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP TRIGGER IF EXISTS update_organization_notes_updated_at ON organization_notes;
CREATE TRIGGER update_organization_notes_updated_at
    BEFORE UPDATE ON organization_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 4. CREATE ORGANIZATION TODOS TABLE
-- ===========================================

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

CREATE INDEX IF NOT EXISTS idx_org_todos_org_id ON organization_todos(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_todos_status ON organization_todos(status);
CREATE INDEX IF NOT EXISTS idx_org_todos_priority ON organization_todos(priority);
CREATE INDEX IF NOT EXISTS idx_org_todos_due_date ON organization_todos(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_todos_assigned ON organization_todos(assigned_to) WHERE assigned_to IS NOT NULL;

ALTER TABLE organization_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all todos" ON organization_todos;

CREATE POLICY "Admins can manage all todos"
    ON organization_todos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP TRIGGER IF EXISTS update_organization_todos_updated_at ON organization_todos;
CREATE TRIGGER update_organization_todos_updated_at
    BEFORE UPDATE ON organization_todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set completed_at when status changes to completed
DROP FUNCTION IF EXISTS set_todo_completed_at() CASCADE;
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

DROP TRIGGER IF EXISTS set_organization_todos_completed_at ON organization_todos;
CREATE TRIGGER set_organization_todos_completed_at
    BEFORE UPDATE ON organization_todos
    FOR EACH ROW
    EXECUTE FUNCTION set_todo_completed_at();

-- ===========================================
-- 5. AUTO-LOG ACTIVITY TRIGGERS
-- ===========================================

-- Function to auto-create activity logs
DROP FUNCTION IF EXISTS log_organization_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_organization_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Log organization creation
        IF TG_TABLE_NAME = 'organizations' THEN
            INSERT INTO organization_activities (
                organization_id, activity_type, title, description, created_by
            ) VALUES (
                NEW.id, 
                'created', 
                'Organization created',
                'Organization "' || NEW.name || '" was created',
                NEW.created_by
            );
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status change
        IF TG_TABLE_NAME = 'organizations' AND OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO organization_activities (
                organization_id, activity_type, title, description, created_by, metadata
            ) VALUES (
                NEW.id,
                'status_changed',
                'Status changed',
                'Status changed from "' || COALESCE(OLD.status, 'none') || '" to "' || NEW.status || '"',
                auth.uid(),
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;
        
        -- Log admin assignment
        IF TG_TABLE_NAME = 'organizations' AND OLD.assigned_admin_id IS DISTINCT FROM NEW.assigned_admin_id THEN
            INSERT INTO organization_activities (
                organization_id, activity_type, title, description, created_by, metadata
            ) VALUES (
                NEW.id,
                'admin_assigned',
                'Admin assigned',
                CASE 
                    WHEN NEW.assigned_admin_id IS NULL THEN 'Admin unassigned'
                    ELSE 'Admin assigned to this organization'
                END,
                auth.uid(),
                jsonb_build_object('admin_id', NEW.assigned_admin_id)
            );
        END IF;
        
        -- Log organization update
        IF TG_TABLE_NAME = 'organizations' AND (OLD.name != NEW.name OR OLD.description IS DISTINCT FROM NEW.description) THEN
            INSERT INTO organization_activities (
                organization_id, activity_type, title, description, created_by
            ) VALUES (
                NEW.id,
                'updated',
                'Organization updated',
                'Organization information was updated',
                auth.uid()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to organizations table
DROP TRIGGER IF EXISTS log_organization_changes ON organizations;
CREATE TRIGGER log_organization_changes
    AFTER INSERT OR UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION log_organization_activity();

-- Function to log note activities
DROP FUNCTION IF EXISTS log_note_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO organization_activities (
            organization_id, activity_type, title, description, created_by
        ) VALUES (
            NEW.organization_id,
            'note_added',
            'Note added',
            'A new note was added',
            NEW.created_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_note_changes ON organization_notes;
CREATE TRIGGER log_note_changes
    AFTER INSERT ON organization_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_activity();

-- Function to log todo activities
DROP FUNCTION IF EXISTS log_todo_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_todo_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO organization_activities (
            organization_id, activity_type, title, description, created_by
        ) VALUES (
            NEW.organization_id,
            'todo_added',
            'Todo added',
            'New task: ' || NEW.title,
            NEW.created_by
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
        INSERT INTO organization_activities (
            organization_id, activity_type, title, description, created_by
        ) VALUES (
            NEW.organization_id,
            'todo_completed',
            'Todo completed',
            'Task completed: ' || NEW.title,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_todo_changes ON organization_todos;
CREATE TRIGGER log_todo_changes
    AFTER INSERT OR UPDATE ON organization_todos
    FOR EACH ROW
    EXECUTE FUNCTION log_todo_activity();

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
-- Organizations CRM features have been successfully added:
-- ✅ Status and assigned admin fields
-- ✅ Activity tracking with auto-logging
-- ✅ Notes management with pinning
-- ✅ Todo/task management
-- ✅ All triggers and policies configured
