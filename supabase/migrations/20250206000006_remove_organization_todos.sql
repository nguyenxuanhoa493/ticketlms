-- =====================================================
-- REMOVE ORGANIZATION TODOS
-- Description: Remove organization_todos table and use tickets instead
-- Date: 2025-02-06
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS log_todo_changes ON organization_todos;
DROP TRIGGER IF EXISTS set_organization_todos_completed_at ON organization_todos;
DROP TRIGGER IF EXISTS update_organization_todos_updated_at ON organization_todos;

-- Drop functions
DROP FUNCTION IF EXISTS log_todo_activity() CASCADE;
DROP FUNCTION IF EXISTS set_todo_completed_at() CASCADE;

-- Drop policies
DROP POLICY IF EXISTS "Admins can manage all todos" ON organization_todos;

-- Drop indexes
DROP INDEX IF EXISTS idx_org_todos_org_id;
DROP INDEX IF EXISTS idx_org_todos_status;
DROP INDEX IF EXISTS idx_org_todos_priority;
DROP INDEX IF EXISTS idx_org_todos_due_date;
DROP INDEX IF EXISTS idx_org_todos_assigned;

-- Drop table
DROP TABLE IF EXISTS organization_todos;

-- Update organization_activities to remove todo-related activity types
-- Note: We keep the enum as is, just won't use todo_added and todo_completed anymore
-- Existing activities with these types will remain in the database as historical data

COMMENT ON TABLE organization_activities IS 'Activity log for organizations. Note: todo_added and todo_completed types are deprecated, use ticket activities instead';
