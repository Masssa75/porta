const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingTables() {
  console.log('🔍 Checking existing database structure...\n');
  
  // Check for users table
  console.log('📊 Checking users table...');
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError && usersError.code === '42P01') {
      console.log('❌ users table does NOT exist');
    } else if (usersError) {
      console.log('⚠️  users table error:', usersError.message);
    } else {
      console.log('✅ users table EXISTS');
      if (users && users.length > 0) {
        console.log('   Columns:', Object.keys(users[0]));
      }
    }
  } catch (e) {
    console.log('❌ Error checking users table:', e.message);
  }
  
  // Check for projects table
  console.log('\n📊 Checking projects table...');
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError && projectsError.code === '42P01') {
      console.log('❌ projects table does NOT exist');
    } else if (projectsError) {
      console.log('⚠️  projects table error:', projectsError.message);
    } else {
      console.log('✅ projects table EXISTS');
      if (projects && projects.length > 0) {
        console.log('   Columns:', Object.keys(projects[0]));
      } else {
        // Try to get column info even if empty
        const { data: cols, error: colError } = await supabase
          .from('projects')
          .select()
          .limit(0);
        
        if (!colError) {
          console.log('   Table is empty, checking structure...');
          // Get actual columns from the existing porta projects table
          const { data: existingProjects } = await supabase
            .from('projects')
            .select('id, name, twitter_handle, coingecko_id, search_terms, is_active, created_at, updated_at, last_tweet_fetch, metadata, notification_settings')
            .limit(0);
          
          console.log('   This is the ORIGINAL porta projects table (not mobile app)');
          console.log('   Has columns: id, name, twitter_handle, coingecko_id, etc.');
          console.log('   ⚠️  Missing user_id column needed for mobile app');
        }
      }
    }
  } catch (e) {
    console.log('❌ Error checking projects table:', e.message);
  }
  
  // Check for referrals table
  console.log('\n📊 Checking referrals table...');
  try {
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .limit(1);
    
    if (referralsError && referralsError.code === '42P01') {
      console.log('❌ referrals table does NOT exist');
    } else if (referralsError) {
      console.log('⚠️  referrals table error:', referralsError.message);
    } else {
      console.log('✅ referrals table EXISTS');
      if (referrals && referrals.length > 0) {
        console.log('   Columns:', Object.keys(referrals[0]));
      }
    }
  } catch (e) {
    console.log('❌ Error checking referrals table:', e.message);
  }
  
  // Check for telegram_connections table (from main app)
  console.log('\n📊 Checking telegram_connections table...');
  try {
    const { data: tg, error: tgError } = await supabase
      .from('telegram_connections')
      .select('*')
      .limit(1);
    
    if (tgError && tgError.code === '42P01') {
      console.log('❌ telegram_connections table does NOT exist');
    } else if (tgError) {
      console.log('⚠️  telegram_connections table error:', tgError.message);
    } else {
      console.log('✅ telegram_connections table EXISTS (from main porta app)');
    }
  } catch (e) {
    console.log('❌ Error checking telegram_connections table:', e.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('The "projects" table that exists is from the MAIN porta app, not the mobile app.');
  console.log('This is why you got the "user_id" column error - it\'s a different schema.');
  console.log('\n🔧 Solution: The fixed SQL will:');
  console.log('1. Drop the existing projects table (from main app)');
  console.log('2. Create new projects table with user_id (for mobile app)');
  console.log('3. Create users and referrals tables');
  console.log('\n⚠️  Note: This will remove the main porta app\'s projects data!');
  console.log('If you need to keep that data, we should use different table names.');
}

checkExistingTables();