const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1';
const API_KEY = 'mobile_app_key_here';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSubscriptionFix() {
  console.log('🧪 Testing Project Subscription Fix\n');
  
  // Create a test user
  const testTelegramId = Math.floor(Math.random() * 1000000000);
  const testUsername = `test_sub_${Date.now()}`;
  
  console.log('1️⃣ Creating test user...');
  
  try {
    // Register user
    const registerResponse = await fetch(`${API_URL}/api-auth/register`, {
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
    
    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok || !registerData.user) {
      console.log('❌ Failed to create user:', registerData);
      return;
    }
    
    const userId = registerData.user.id;
    console.log(`✅ User created: ${userId}`);
    
    // Get available projects
    console.log('\n2️⃣ Getting available projects...');
    
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, symbol')
      .limit(3);
    
    if (!projects || projects.length === 0) {
      console.log('❌ No projects found');
      return;
    }
    
    console.log(`✅ Found ${projects.length} projects:`, projects.map(p => p.name).join(', '));
    
    // Test the new subscription endpoint
    console.log('\n3️⃣ Testing subscription with new endpoint structure...');
    
    const subscribeResponse = await fetch(`${API_URL}/api-projects/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify({
        project_id: projects[0].id,
        custom_threshold: 7
      })
    });
    
    console.log(`Response status: ${subscribeResponse.status}`);
    const subscribeData = await subscribeResponse.json();
    
    if (subscribeResponse.ok) {
      console.log('✅ Subscription successful!');
      console.log('   Project:', subscribeData.project?.name);
      
      // Verify in database
      const { data: userProject } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projects[0].id)
        .single();
      
      if (userProject) {
        console.log('✅ Verified in database - user_projects record exists');
      }
      
      // Test getting subscribed projects
      console.log('\n4️⃣ Testing get subscribed projects...');
      
      const subscribedResponse = await fetch(`${API_URL}/api-projects/subscribed`, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${userId}`
        }
      });
      
      if (subscribedResponse.ok) {
        const subscribedData = await subscribedResponse.json();
        console.log(`✅ Retrieved ${subscribedData.length} subscribed projects`);
      }
      
    } else {
      console.log('❌ Subscription failed:', subscribeData);
      
      // Check if it's using the old endpoint structure
      console.log('\n🔍 Checking current Edge Function endpoints...');
      
      // Try to call the base endpoint to see what error we get
      const baseResponse = await fetch(`${API_URL}/api-projects`, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${userId}`
        }
      });
      
      const baseData = await baseResponse.json();
      console.log('Base endpoint response:', baseData);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('user_projects').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('The api-projects Edge Function needs to be deployed with the new endpoint structure.');
  console.log('Once deployed, the mobile app will be able to subscribe to projects!');
}

testSubscriptionFix();