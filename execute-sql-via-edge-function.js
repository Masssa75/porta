#!/usr/bin/env node

// Alternative approach: Execute SQL via Supabase Edge Function
// Since we can't directly execute SQL from the client, we'll create a temporary
// Edge Function to do it for us

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Alternative SQL execution approach...\n');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing Supabase credentials');
  console.log('\n📝 Manual execution required:');
  console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
  console.log('2. Copy contents from create-users-table.sql');
  console.log('3. Click "Run"');
  
  // Create a summary for easy manual execution
  const summary = `
-- Quick summary of what the migration does:
-- 1. Creates 'users' table for mobile app users
-- 2. Creates 'referrals' table for referral tracking
-- 3. Creates 'projects' table for user's tracked crypto projects
-- 4. Sets up indexes and RLS policies
-- 5. Creates triggers for updated_at timestamps

-- To run manually:
-- Copy the full contents of create-users-table.sql
-- Paste in Supabase SQL Editor and click Run
`;
  
  fs.writeFileSync('migration-summary.txt', summary);
  console.log('\n✅ Created migration-summary.txt for reference');
  process.exit(0);
}

// Check if tables already exist using Supabase client
async function checkTablesExist() {
  console.log('🔍 Checking if tables already exist...\n');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const tables = ['users', 'referrals', 'projects'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      results[table] = !error;
      console.log(`${table}: ${!error ? '✅ Exists' : '❌ Not found'}`);
    } catch (e) {
      results[table] = false;
    }
  }
  
  return results;
}

// Main execution
async function main() {
  const tableStatus = await checkTablesExist();
  
  const allTablesExist = Object.values(tableStatus).every(exists => exists);
  
  if (allTablesExist) {
    console.log('\n✅ All tables already exist! Migration appears to be complete.');
    console.log('\n📊 Table Status:');
    console.log('- users table: ✅');
    console.log('- referrals table: ✅');
    console.log('- projects table: ✅');
    return;
  }
  
  console.log('\n⚠️  Some tables are missing.');
  console.log('\n📝 Please run the migration manually:');
  console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
  console.log('2. Copy the contents of create-users-table.sql');
  console.log('3. Paste and click "Run"');
  
  // Create a direct link for convenience
  const sqlEditorUrl = 'https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new';
  console.log(`\n🔗 Direct link: ${sqlEditorUrl}`);
}

main().catch(console.error);