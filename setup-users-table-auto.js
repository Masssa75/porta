const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUsersTable() {
  console.log('🔄 Setting up users table...\n');
  
  try {
    // Check if users table exists by trying to query it
    console.log('📊 Checking if users table exists...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist
      console.log('❌ Users table does not exist.');
      console.log('\n⚠️  MANUAL ACTION REQUIRED:\n');
      console.log('1. Go to Supabase SQL Editor:');
      console.log('   https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new\n');
      console.log('2. Copy and paste the SQL from: create-users-table.sql');
      console.log('3. Run the SQL to create all necessary tables\n');
      
      // Show the SQL file path
      const sqlPath = path.join(__dirname, 'create-users-table.sql');
      console.log(`📄 SQL file location: ${sqlPath}\n`);
      
      // Also save a direct link for easier access
      const quickSetupPath = path.join(__dirname, 'SETUP_USERS_TABLE.md');
      const setupInstructions = `# Quick Setup Instructions for Users Table

## 🚨 URGENT: Users table needs to be created

### Step 1: Open Supabase SQL Editor
[Click here to open SQL Editor](https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new)

### Step 2: Copy the SQL
Open the file: \`create-users-table.sql\` in this project

### Step 3: Paste and Run
1. Paste the entire SQL content into the editor
2. Click "Run" button
3. You should see "Success" message

### Step 4: Verify
After running the SQL, the mobile app authentication will work!

## What This Creates:
- **users** table - User accounts with Telegram auth
- **referrals** table - Referral tracking system  
- **projects** table - User's tracked crypto projects
- All necessary indexes and security policies

## Mobile App URL:
https://portalerts.xyz

## Telegram Bot:
@porta_alerts_bot
`;
      
      fs.writeFileSync(quickSetupPath, setupInstructions);
      console.log(`📝 Created quick setup guide: ${quickSetupPath}`);
      
      return false;
    } else if (error) {
      console.error('❌ Error checking table:', error.message);
      return false;
    } else {
      console.log('✅ Users table exists!');
      
      // Try to insert a test record to verify structure
      console.log('\n🧪 Testing table structure...');
      const testUser = {
        telegram_chat_id: 999999999,
        telegram_username: 'test_verify',
        telegram_verified: true,
        status: 'verified',
        tier: 'free',
        projects_limit: 5,
        referrals_required: 5,
        referrals_completed: 0,
        referral_code: `TEST${Date.now()}`,
        connection_token: 'test_token_verify',
        notification_threshold: 7
      };
      
      const { data: insertTest, error: insertError } = await supabase
        .from('users')
        .insert(testUser)
        .select();
      
      if (insertError) {
        console.log('⚠️  Table exists but may be missing columns:', insertError.message);
        console.log('\nRun the add-connection-token-column.sql migration if needed.');
      } else {
        console.log('✅ Table structure verified!');
        
        // Clean up test user
        await supabase
          .from('users')
          .delete()
          .eq('telegram_chat_id', 999999999);
      }
      
      // Check for projects and referrals tables too
      console.log('\n📊 Checking related tables...');
      
      const { error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
        
      if (projectsError && projectsError.code === '42P01') {
        console.log('❌ Projects table missing - run full migration');
      } else {
        console.log('✅ Projects table exists');
      }
      
      const { error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .limit(1);
        
      if (referralsError && referralsError.code === '42P01') {
        console.log('❌ Referrals table missing - run full migration');
      } else {
        console.log('✅ Referrals table exists');
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🧪 Testing authentication flow...');
  
  const testToken = `test_${Date.now()}`;
  const testChatId = Math.floor(Math.random() * 1000000000);
  
  console.log(`Test token: ${testToken}`);
  console.log(`Test chat ID: ${testChatId}`);
  
  // Test the API auth endpoint
  const apiUrl = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-auth';
  
  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile_app_key_here'
      },
      body: JSON.stringify({
        telegramId: testChatId,
        telegramUsername: `test_user_${Date.now()}`,
        referralCode: null
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication API working!');
      console.log(`User created: ${data.user?.id}`);
      
      // Clean up test user
      if (data.user?.id) {
        await supabase
          .from('users')
          .delete()
          .eq('id', data.user.id);
      }
    } else {
      const error = await response.text();
      console.log('❌ Authentication API error:', error);
    }
  } catch (error) {
    console.log('❌ Could not test authentication:', error.message);
  }
}

// Run setup
setupUsersTable().then(async (success) => {
  if (success) {
    await testAuthentication();
    console.log('\n🎉 Setup complete! Mobile app authentication is ready.');
  } else {
    console.log('\n⚠️  Manual setup required - see instructions above.');
  }
});