-- Add monitoring fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS last_monitored TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 7;

-- Create index for efficient monitoring queries
CREATE INDEX IF NOT EXISTS idx_projects_last_monitored 
ON projects(last_monitored ASC NULLS FIRST);

-- Add comment
COMMENT ON COLUMN projects.last_monitored IS 'Last time this project was monitored for updates';
COMMENT ON COLUMN projects.notification_threshold IS 'Minimum importance score (1-10) to trigger notifications';