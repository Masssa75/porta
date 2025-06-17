const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...\n');
  
  // Try to select from users table to see what columns exist
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error querying users table:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Users table columns:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('Users table exists but is empty');
    
    // Try to insert a test user to see what columns are required
    const testUser = {
      telegram_chat_id: 999999999,
      telegram_username: 'test_structure',
      telegram_verified: true,
      status: 'verified',
      tier: 'free',
      projects_limit: 5,
      referrals_required: 5,
      referrals_completed: 0,
      referral_code: 'TEST123',
      connection_token: 'test_token',
      notification_threshold: 7
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();
      
    if (insertError) {
      console.log('\nError inserting test user:', insertError.message);
      console.log('This suggests missing columns or constraints');
    } else {
      console.log('\nSuccessfully inserted test user, columns available:');
      console.log(Object.keys(insertData[0]));
      
      // Clean up
      await supabase.from('users').delete().eq('telegram_chat_id', 999999999);
    }
  }
}

checkUsersTable();