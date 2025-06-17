const fetch = require('node-fetch');

const API_URL = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1';
const API_KEY = 'mobile_app_key_here'; // This should match the one in Edge Function

async function testRegistrationFlow() {
  console.log('🧪 Testing Mobile App Registration Flow\n');
  
  // Step 1: Generate a connection token (simulating what the mobile app does)
  const connectionToken = Math.random().toString(36).substring(2, 15);
  console.log(`1️⃣ Generated connection token: ${connectionToken}`);
  console.log(`   User would open: https://t.me/porta_alerts_bot?start=${connectionToken}\n`);
  
  // Step 2: Simulate checking connection status (what mobile app does while polling)
  console.log('2️⃣ Checking connection status...');
  
  try {
    const checkResponse = await fetch(`${API_URL}/api-auth/check-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ token: connectionToken })
    });
    
    const checkData = await checkResponse.json();
    console.log('   Response:', checkData);
    console.log('   Expected: { connected: false } (since no one clicked the bot link yet)\n');
    
    // Step 3: Test with a mock telegram ID (simulating successful connection)
    const mockTelegramId = 123456789;
    const mockUsername = 'testuser';
    
    console.log('3️⃣ Testing registration with mock Telegram data...');
    const registerResponse = await fetch(`${API_URL}/api-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        telegramId: mockTelegramId,
        telegramUsername: mockUsername,
        referralCode: null
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('   Registration response:', registerData);
    
    if (registerData.user) {
      console.log('   ✅ User created/found successfully!');
      console.log(`   User ID: ${registerData.user.id}`);
      console.log(`   Referral code: ${registerData.user.referral_code}`);
      console.log(`   Is new user: ${registerData.isNew}`);
    }
    
    // Step 4: Test profile endpoint
    console.log('\n4️⃣ Testing profile endpoint...');
    const profileResponse = await fetch(`${API_URL}/api-auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${registerData.user?.id}`,
        'X-API-Key': API_KEY
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('   Profile response:', profileData);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  console.log('\n📱 Full registration flow test complete!');
  console.log('\nNext steps to test manually:');
  console.log('1. Open https://portalerts.xyz on your phone');
  console.log('2. Click "Connect Telegram"');
  console.log('3. Complete the bot connection');
  console.log('4. Return to the app');
  console.log('5. You should be logged in!');
}

testRegistrationFlow();