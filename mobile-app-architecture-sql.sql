-- Mobile App Database Schema
-- This creates user-specific tables that work alongside the main porta monitoring system

-- 1. Users table for mobile app authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Telegram authentication
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_verified BOOLEAN DEFAULT false,
    
    -- Connection flow
    connection_token TEXT,
    
    -- User status and tier
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'banned')),
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'lifetime')),
    
    -- Limits
    projects_limit INTEGER DEFAULT 5,
    
    -- Referral system
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES users(id),
    referrals_required INTEGER DEFAULT 5,
    referrals_completed INTEGER DEFAULT 0,
    
    -- Token wallet (Base network)
    wallet_address TEXT,
    tokens_balance BIGINT DEFAULT 0,
    
    -- Notification preferences
    notification_threshold INTEGER DEFAULT 7 CHECK (notification_threshold >= 1 AND notification_threshold <= 10),
    
    -- Metadata
    last_active TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. User's subscribed projects (links to main projects table)
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Link to user
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Link to main projects table (from porta monitoring system)
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- User's custom settings for this project
    is_active BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT true,
    custom_threshold INTEGER, -- Override user's default threshold
    
    -- Tracking
    last_notified TIMESTAMPTZ,
    notifications_sent INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(user_id, project_id)
);

-- 3. Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    referral_method TEXT DEFAULT 'telegram',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(referrer_id, referred_id)
);

-- 4. API access logs (track API usage between apps)
CREATE TABLE IF NOT EXISTS api_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Which user made the request
    user_id UUID REFERENCES users(id),
    
    -- What they accessed
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    
    -- Rate limiting
    ip_address INET,
    user_agent TEXT,
    
    -- Request/Response details
    request_body JSONB,
    response_time_ms INTEGER,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX idx_users_connection_token ON users(connection_token);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_tier ON users(tier);

CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX idx_user_projects_active ON user_projects(is_active);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);

CREATE INDEX idx_api_access_logs_user_id ON api_access_logs(user_id);
CREATE INDEX idx_api_access_logs_created_at ON api_access_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON user_projects FOR ALL USING (true);
CREATE POLICY "Service role full access" ON referrals FOR ALL USING (true);
CREATE POLICY "Service role full access" ON api_access_logs FOR ALL USING (true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Mobile app users authenticated via Telegram';
COMMENT ON TABLE user_projects IS 'Links users to projects they want to monitor';
COMMENT ON TABLE referrals IS 'Referral tracking between users';
COMMENT ON TABLE api_access_logs IS 'Track API usage between frontend and backend';

-- Helper view to get user's projects with full details
CREATE OR REPLACE VIEW user_projects_detailed AS
SELECT 
    up.*,
    u.telegram_username,
    u.tier as user_tier,
    p.name as project_name,
    p.symbol as project_symbol,
    p.coingecko_id,
    p.twitter_handle,
    p.notification_threshold as project_threshold
FROM user_projects up
JOIN users u ON up.user_id = u.id
JOIN projects p ON up.project_id = p.id
WHERE up.is_active = true;