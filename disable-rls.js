const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Try to select from projects table
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing projects table:', error);
      console.log('\nThe error suggests Row Level Security (RLS) is enabled.');
      console.log('\nTo fix this, you need to:');
      console.log('1. Go to https://app.supabase.com/project/midojobnawatvxhmhmoh/editor');
      console.log('2. Click on the "projects" table');
      console.log('3. Click on "Policies" tab');
      console.log('4. Either:');
      console.log('   a) Disable RLS by clicking the toggle, OR');
      console.log('   b) Add a policy that allows SELECT, INSERT, UPDATE, DELETE for all users');
      console.log('\nFor quick development, disabling RLS is easiest.');
    } else {
      console.log('✓ Successfully connected to Supabase!');
      console.log('✓ Projects table is accessible');
      console.log('Current projects:', data);
    }
    
    // Test insert capability
    console.log('\nTesting insert capability...');
    const testProject = {
      name: 'Test Project',
      symbol: 'TEST',
      coingecko_id: 'test-' + Date.now(),
      alert_threshold: 7,
      wallet_addresses: []
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert(testProject)
      .select();
    
    if (insertError) {
      console.error('✗ Cannot insert data:', insertError.message);
    } else {
      console.log('✓ Insert test successful!');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', insertData[0].id);
      
      if (!deleteError) {
        console.log('✓ Cleanup successful');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();