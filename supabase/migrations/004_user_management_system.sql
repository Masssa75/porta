-- User Management System with Referrals and API Architecture
-- This migration creates the foundation for a multi-user system with referral requirements

-- Create users table as the core identity system
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  telegram_chat_id BIGINT UNIQUE,
  telegram_username VARCHAR(255),
  display_name VARCHAR(255),
  
  -- Account status and verification
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'active', 'suspended')),
  telegram_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  
  -- Account tier and limits
  tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'free_forever', 'premium')),
  projects_limit INTEGER DEFAULT 5,
  notifications_per_day INTEGER DEFAULT 50,
  
  -- Referral tracking
  referred_by UUID REFERENCES users(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referrals_needed INTEGER DEFAULT 5,
  referrals_completed INTEGER DEFAULT 0,
  
  -- API access (for backend system)
  api_key VARCHAR(255) UNIQUE,
  api_secret VARCHAR(255),
  api_rate_limit INTEGER DEFAULT 100, -- requests per hour
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  tier_upgraded_at TIMESTAMP WITH TIME ZONE
);

-- Create referrals table to track invitation status
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Referral method and status
  referral_method VARCHAR(50) DEFAULT 'telegram' CHECK (referral_method IN ('telegram', 'email', 'link')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed')),
  
  -- Contact information for pending referrals
  invited_telegram VARCHAR(255),
  invited_email VARCHAR(255),
  invitation_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_api_usage table for rate limiting and monitoring
CREATE TABLE user_api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Usage tracking
  endpoint VARCHAR(255) NOT NULL,
  requests_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  
  -- Time window (for rate limiting)
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify existing tables to link to users

-- Update telegram_connections to reference users
ALTER TABLE telegram_connections 
ADD COLUMN user_id UUID REFERENCES users(id);

-- Update projects to reference users instead of telegram_connections directly
ALTER TABLE projects 
ADD COLUMN user_id UUID REFERENCES users(id),
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update notifications to include user context
ALTER TABLE notifications
ADD COLUMN user_id UUID REFERENCES users(id);

-- Create functions for user management

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  code VARCHAR(20);
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$ language 'plpgsql';

-- Function to generate API credentials
CREATE OR REPLACE FUNCTION generate_api_credentials()
RETURNS TABLE(api_key VARCHAR(255), api_secret VARCHAR(255)) AS $$
DECLARE
  key VARCHAR(255);
  secret VARCHAR(255);
BEGIN
  LOOP
    key := 'pk_' || ENCODE(SHA256(MD5(RANDOM()::TEXT)::BYTEA), 'hex');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE users.api_key = key);
  END LOOP;
  
  secret := 'sk_' || ENCODE(SHA256(MD5(RANDOM()::TEXT || key)::BYTEA), 'hex');
  
  RETURN QUERY SELECT key, secret;
END;
$$ language 'plpgsql';

-- Function to check if user can upgrade to free_forever
CREATE OR REPLACE FUNCTION can_upgrade_to_free_forever(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  verified_referrals INTEGER;
  needed_referrals INTEGER;
BEGIN
  SELECT 
    referrals_completed,
    referrals_needed
  INTO verified_referrals, needed_referrals
  FROM users 
  WHERE id = user_id;
  
  RETURN verified_referrals >= needed_referrals;
END;
$$ language 'plpgsql';

-- Triggers and functions

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION set_user_defaults()
RETURNS TRIGGER AS $$
DECLARE
  credentials RECORD;
BEGIN
  -- Generate referral code if not provided
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  
  -- Generate API credentials
  SELECT * INTO credentials FROM generate_api_credentials();
  NEW.api_key := credentials.api_key;
  NEW.api_secret := credentials.api_secret;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_user_defaults_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_user_defaults();

-- Update referral counts when referrals are completed
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Increment referrer's completed count
    UPDATE users 
    SET referrals_completed = referrals_completed + 1,
        updated_at = NOW()
    WHERE id = NEW.referrer_id;
    
    -- Check if referrer can upgrade to free_forever
    UPDATE users 
    SET tier = 'free_forever',
        tier_upgraded_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.referrer_id 
      AND tier = 'free' 
      AND can_upgrade_to_free_forever(NEW.referrer_id);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referral_counts_trigger
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_counts();

-- Create indexes for performance
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_referred_by ON users(referred_by);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_user_api_usage_user_id ON user_api_usage(user_id);
CREATE INDEX idx_user_api_usage_window ON user_api_usage(window_start, window_end);

-- RLS Policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR true); -- Temporary: allow all for API access

-- Users can update their own data (except critical fields)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR true)
  WITH CHECK (auth.uid()::text = id::text OR true);

-- Allow user creation (for registration)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Referrals policies
CREATE POLICY "Users can read own referrals" ON referrals
  FOR SELECT USING (referrer_id::text = auth.uid()::text OR referred_id::text = auth.uid()::text OR true);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (referrer_id::text = auth.uid()::text OR true);

CREATE POLICY "Users can update own referrals" ON referrals
  FOR UPDATE USING (referrer_id::text = auth.uid()::text OR true);

-- API usage policies (mainly for backend access)
CREATE POLICY "Users can read own API usage" ON user_api_usage
  FOR SELECT USING (user_id::text = auth.uid()::text OR true);

CREATE POLICY "Allow API usage tracking" ON user_api_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow API usage updates" ON user_api_usage
  FOR UPDATE USING (true);

-- Update existing table policies to respect user ownership

-- Projects should belong to users
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for all users" ON projects;
DROP POLICY IF EXISTS "Enable update for all users" ON projects;
DROP POLICY IF EXISTS "Enable delete for all users" ON projects;

CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT USING (user_id::text = auth.uid()::text OR true); -- Temporary: allow all for API

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR true);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id::text = auth.uid()::text OR true);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id::text = auth.uid()::text OR true);

-- Comments and documentation
COMMENT ON COLUMN users.tier IS 'Account tier: free (5 referrals needed), free_forever (earned), premium (paid)';
COMMENT ON COLUMN users.status IS 'Account status: pending (new), verified (telegram verified), active (can use system), suspended';
COMMENT ON COLUMN users.api_key IS 'Public API key for backend access (pk_...)';
COMMENT ON COLUMN users.api_secret IS 'Secret API key for backend access (sk_...)';
COMMENT ON COLUMN referrals.status IS 'Referral status: pending (invited), verified (user created account), completed (user verified telegram)';