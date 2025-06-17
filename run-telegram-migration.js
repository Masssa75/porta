const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
  
  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/003_add_telegram_connections.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Migration SQL:');
  console.log('================');
  console.log(sql);
  console.log('================\n');
  
  console.log('⚠️  This migration needs to be run in the Supabase SQL Editor');
  console.log('📋 Steps:');
  console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
  console.log('2. Copy and paste the SQL above');
  console.log('3. Click "Run" to execute');
  console.log('\n✅ Once done, the Telegram connection system will be ready!');
}

runMigration();