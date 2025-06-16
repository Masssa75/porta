-- Create telegram_connections table for storing bot connections
CREATE TABLE telegram_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_token VARCHAR(255) UNIQUE NOT NULL,
  telegram_chat_id BIGINT UNIQUE,
  telegram_username VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE,
  notification_preferences JSONB DEFAULT '{
    "important_tweets": true,
    "ai_analysis": true,
    "daily_digest": false,
    "threshold": 7
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add telegram_connection_id to projects table for user-specific project notifications
ALTER TABLE projects 
ADD COLUMN telegram_connection_id UUID REFERENCES telegram_connections(id);

-- Create indexes for performance
CREATE INDEX idx_telegram_connections_token ON telegram_connections(connection_token);
CREATE INDEX idx_telegram_connections_chat_id ON telegram_connections(telegram_chat_id);
CREATE INDEX idx_projects_telegram_connection ON projects(telegram_connection_id);

-- Add RLS policies
ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a connection (for initial setup)
CREATE POLICY "Allow connection creation" ON telegram_connections
  FOR INSERT WITH CHECK (true);

-- Allow reading own connections by token
CREATE POLICY "Allow reading own connection" ON telegram_connections
  FOR SELECT USING (true);

-- Allow updating own connections
CREATE POLICY "Allow updating own connection" ON telegram_connections
  FOR UPDATE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_telegram_connections_updated_at
  BEFORE UPDATE ON telegram_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();