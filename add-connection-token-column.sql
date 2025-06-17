-- Add connection_token column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS connection_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_connection_token ON users(connection_token);

-- Add notification_threshold column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 7;

-- Update comment on the table
COMMENT ON COLUMN users.connection_token IS 'Temporary token used for Telegram connection flow';
COMMENT ON COLUMN users.notification_threshold IS 'Minimum importance score (1-10) for notifications';