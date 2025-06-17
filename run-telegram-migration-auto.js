const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running Telegram connections migration...\n');
  
  try {
    // Create telegram_connections table
    console.log('📊 Creating telegram_connections table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS telegram_connections (
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
      `
    });
    
    if (tableError) {
      // Try alternative approach - create table step by step
      console.log('Trying alternative approach...');
      
      // Check if table exists
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'telegram_connections');
      
      if (!tables || tables.length === 0) {
        console.log('❌ Cannot create table via API. Manual creation required.');
        console.log('\n📋 Please run this SQL in Supabase dashboard:');
        console.log('https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new\n');
        
        const fullSql = `-- Create telegram_connections table
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

-- Add telegram_connection_id to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS telegram_connection_id UUID REFERENCES telegram_connections(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_telegram_connections_token ON telegram_connections(connection_token);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_chat_id ON telegram_connections(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_projects_telegram_connection ON projects(telegram_connection_id);

-- Enable RLS
ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow connection creation" ON telegram_connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading own connection" ON telegram_connections
  FOR SELECT USING (true);

CREATE POLICY "Allow updating own connection" ON telegram_connections
  FOR UPDATE USING (true);

-- Updated_at trigger
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
  EXECUTE FUNCTION update_updated_at_column();`;
        
        console.log(fullSql);
        return;
      } else {
        console.log('✅ Table telegram_connections already exists');
      }
    } else {
      console.log('✅ Table created successfully');
    }
    
    // Try to add column to projects table
    console.log('\n🔗 Adding telegram_connection_id to projects table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS telegram_connection_id UUID REFERENCES telegram_connections(id);`
    });
    
    if (alterError) {
      console.log('⚠️  Could not add column via API');
    } else {
      console.log('✅ Column added successfully');
    }
    
    console.log('\n🎉 Migration process completed!');
    console.log('Note: Some operations may need manual execution in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\nPlease run the migration manually in Supabase SQL editor');
  }
}

runMigration();