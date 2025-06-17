-- Create users table for mobile app
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
    
    -- Project limits
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

-- Create indexes
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX idx_users_connection_token ON users(connection_token);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_status ON users(status);

-- Create referrals table
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

-- Create indexes for referrals
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Create projects table for user's tracked projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project info from CoinGecko
    coingecko_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    image TEXT,
    
    -- User preferences for this project
    is_active BOOLEAN DEFAULT true,
    notification_enabled BOOLEAN DEFAULT true,
    custom_threshold INTEGER, -- Override user's default threshold
    
    -- Tracking metadata
    last_checked TIMESTAMPTZ,
    alerts_sent INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(user_id, coingecko_id)
);

-- Create indexes for projects
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_coingecko_id ON projects(coingecko_id);
CREATE INDEX idx_projects_is_active ON projects(is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
-- Service role can do everything
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (true);

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- RLS Policies for referrals
CREATE POLICY "Service role full access" ON referrals
    FOR ALL USING (true);

-- RLS Policies for projects
CREATE POLICY "Service role full access" ON projects
    FOR ALL USING (true);

-- Users can manage their own projects
CREATE POLICY "Users can manage own projects" ON projects
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Mobile app users authenticated via Telegram';
COMMENT ON TABLE referrals IS 'Referral tracking between users';
COMMENT ON TABLE projects IS 'Crypto projects tracked by users';

-- Insert some test data (optional, remove in production)
-- This helps verify the schema is working
DO $$
BEGIN
    -- Only insert if table is empty
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (telegram_chat_id, telegram_username, telegram_verified, status, referral_code)
        VALUES (123456789, 'test_user', true, 'verified', 'TEST123');
    END IF;
END $$;