-- Function to auto-create activity logs
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
