-- Add only_show_in_admin column to tickets table
ALTER TABLE tickets ADD COLUMN only_show_in_admin BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN tickets.only_show_in_admin IS 'If true, this ticket is only visible to admin users'; 