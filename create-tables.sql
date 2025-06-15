-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  coingecko_id TEXT UNIQUE NOT NULL,
  twitter_handle TEXT,
  wallet_addresses TEXT[] DEFAULT '{}',
  alert_threshold INTEGER DEFAULT 7 CHECK (alert_threshold >= 1 AND alert_threshold <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create tweet_analyses table
CREATE TABLE IF NOT EXISTS tweet_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tweet_id TEXT UNIQUE NOT NULL,
  tweet_text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  importance_score INTEGER DEFAULT 0 CHECK (importance_score >= 0 AND importance_score <= 10),
  category TEXT,
  summary TEXT,
  url TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tweet_analysis_id UUID REFERENCES tweet_analyses(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notification_type TEXT DEFAULT 'telegram',
  recipient TEXT,
  status TEXT DEFAULT 'sent'
);

-- Create monitoring_logs table
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  source TEXT NOT NULL,
  tweets_found INTEGER DEFAULT 0,
  error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_coingecko_id ON projects(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_projects_symbol ON projects(symbol);
CREATE INDEX IF NOT EXISTS idx_tweet_analyses_project_id ON tweet_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analyses_importance_score ON tweet_analyses(importance_score);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_project_id ON monitoring_logs(project_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();