const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1';
const API_KEY = 'mobile_app_key_here';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFullRegistrationFlow() {
  console.log('🧪 Testing Full User Registration Flow\n');
  
  // Step 1: Test API endpoint
  console.log('1️⃣ Testing API registration endpoint...');
  
  const testTelegramId = Math.floor(Math.random() * 1000000000);
  const testUsername = `test_user_${Date.now()}`;
  
  try {
    const response = await fetch(`${API_URL}/api-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        telegramId: testTelegramId,
        telegramUsername: testUsername,
        referralCode: null
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.user) {
      console.log('✅ Registration successful!');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Referral code: ${data.user.referral_code}`);
      console.log(`   Tier: ${data.user.tier}`);
      console.log(`   Projects limit: ${data.user.projects_limit}`);
      
      const userId = data.user.id;
      
      // Step 2: Test project subscription
      console.log('\n2️⃣ Testing project subscription...');
      
      // Get available projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, symbol')
        .limit(2);
      
      if (projects && projects.length > 0) {
        console.log(`Found ${projects.length} projects to test with`);
        
        // Subscribe to first project
        const projectResponse = await fetch(`${API_URL}/api-projects/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'Authorization': `Bearer ${userId}`
          },
          body: JSON.stringify({
            project_id: projects[0].id,
            custom_threshold: 8
          })
        });
        
        if (projectResponse.ok) {
          console.log(`✅ Subscribed to ${projects[0].name} (${projects[0].symbol})`);
        } else {
          const error = await projectResponse.text();
          console.log('❌ Failed to subscribe:', error);
        }
      }
      
      // Step 3: Test Telegram webhook
      console.log('\n3️⃣ Testing Telegram webhook integration...');
      
      // Simulate what happens when user clicks /start in Telegram
      const webhookResponse = await fetch(`${API_URL}/telegram-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            chat: {
              id: testTelegramId,
              username: testUsername
            },
            text: '/status',
            from: {
              username: testUsername
            }
          }
        })
      });
      
      if (webhookResponse.ok) {
        console.log('✅ Telegram webhook responded correctly');
      }
      
      // Step 4: Test connection flow
      console.log('\n4️⃣ Testing connection token flow...');
      
      const connectionToken = `test_${Date.now()}`;
      
      // Update user with connection token
      await supabase
        .from('users')
        .update({ connection_token: connectionToken })
        .eq('id', userId);
      
      // Test check-connection endpoint
      const checkResponse = await fetch(`${API_URL}/api-auth/check-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ token: connectionToken })
      });
      
      const checkData = await checkResponse.json();
      
      if (checkData.connected) {
        console.log('✅ Connection check working!');
        console.log(`   User verified: ${checkData.user.telegram_username}`);
      }
      
      // Step 5: Verify database state
      console.log('\n5️⃣ Verifying database state...');
      
      // Check user exists
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (dbUser) {
        console.log('✅ User exists in database');
      }
      
      // Check user projects
      const { data: userProjects } = await supabase
        .from('user_projects')
        .select('*, projects(name, symbol)')
        .eq('user_id', userId);
      
      if (userProjects && userProjects.length > 0) {
        console.log(`✅ User has ${userProjects.length} project subscriptions`);
      }
      
      // Step 6: Test the view
      const { data: detailedView } = await supabase
        .from('user_projects_detailed')
        .select('*')
        .eq('user_id', userId);
      
      if (detailedView && detailedView.length > 0) {
        console.log('✅ user_projects_detailed view working');
      }
      
      // Cleanup
      console.log('\n🧹 Cleaning up test data...');
      await supabase.from('user_projects').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);
      
      console.log('\n🎉 Full registration flow test complete!');
      console.log('\n📱 Next steps:');
      console.log('1. Check if portalerts.xyz is live (DNS may still be propagating)');
      console.log('2. Try connecting with real Telegram account');
      console.log('3. Subscribe to some projects');
      console.log('4. Wait for notifications when important tweets appear!');
      
    } else {
      console.log('❌ Registration failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testFullRegistrationFlow();