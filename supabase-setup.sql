-- Enable Row Level Security for all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table (allow all operations for now)
CREATE POLICY "Enable read access for all users" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON projects
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON projects
    FOR DELETE USING (true);

-- Create policies for tweet_analyses table
CREATE POLICY "Enable read access for all users" ON tweet_analyses
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON tweet_analyses
    FOR INSERT WITH CHECK (true);

-- Create policies for notifications table
CREATE POLICY "Enable read access for all users" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create policies for monitoring_logs table
CREATE POLICY "Enable read access for all users" ON monitoring_logs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON monitoring_logs
    FOR INSERT WITH CHECK (true);