-- Add jira_link column to tickets table
ALTER TABLE tickets ADD COLUMN jira_link TEXT;

-- Add comment to document the column
COMMENT ON COLUMN tickets.jira_link IS 'Link to JIRA issue (e.g., https://vieted.atlassian.net/browse/CLD-1741)'; 