#!/usr/bin/env node

// Direct SQL migration execution using Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runMigration() {
  console.log('🔧 Running users table migration directly via Supabase client...\n');

  // Initialize Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read SQL file
  const sqlPath = path.join(__dirname, 'create-users-table.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('📋 SQL to execute:');
  console.log(sqlContent.substring(0, 200) + '...\n');

  try {
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API with the service role key
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      // If the RPC function doesn't exist, we'll need to create it first
      console.log('⚠️  Direct SQL execution not available via RPC.');
      console.log('📝 Alternative: Use the Supabase Dashboard SQL Editor');
      console.log('\nSteps:');
      console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
      console.log('2. Paste the contents of create-users-table.sql');
      console.log('3. Click "Run" to execute the migration');
      
      // Save SQL to a temporary file for easy copying
      const tempFile = path.join(__dirname, 'migration-to-run.sql');
      fs.writeFileSync(tempFile, sqlContent);
      console.log(`\n✅ SQL saved to: ${tempFile}`);
      console.log('You can copy the contents from this file.');
      
      return;
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('Result:', result);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if we can at least verify table existence
    console.log('\n🔍 Checking if tables already exist...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('count')
      .limit(1);
      
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    console.log('\nTable status:');
    console.log(`- users table: ${usersError ? '❌ Not found' : '✅ Exists'}`);
    console.log(`- referrals table: ${referralsError ? '❌ Not found' : '✅ Exists'}`);
    console.log(`- projects table: ${projectsError ? '❌ Not found' : '✅ Exists'}`);
    
    if (!usersError && !referralsError && !projectsError) {
      console.log('\n✅ All tables already exist! Migration may have already been run.');
    } else {
      console.log('\n📝 Please run the migration manually via Supabase Dashboard.');
    }
  }
}

// Run the migration
runMigration().catch(console.error);