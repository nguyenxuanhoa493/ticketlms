-- Add CRM fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_assigned_admin ON organizations(assigned_admin_id);

-- Add comment
COMMENT ON COLUMN organizations.status IS 'Organization operational status: active, inactive, pending';
COMMENT ON COLUMN organizations.assigned_admin_id IS 'Admin user responsible for this organization';
