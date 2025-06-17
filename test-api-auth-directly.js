const fetch = require('node-fetch');

const API_URL = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-auth';

async function testDirectly() {
  console.log('🧪 Testing API Auth Edge Function directly\n');
  
  // Test with curl equivalent
  const mockTelegramId = Math.floor(Math.random() * 1000000000);
  const mockUsername = `testuser_${Date.now()}`;
  
  console.log('Testing registration endpoint...');
  console.log(`Telegram ID: ${mockTelegramId}`);
  console.log(`Username: ${mockUsername}\n`);
  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile_app_key_here'
      },
      body: JSON.stringify({
        telegramId: mockTelegramId,
        telegramUsername: mockUsername,
        referralCode: null
      })
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, response.headers.raw());
    
    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));
    
    if (data.user) {
      console.log('\n✅ Success! User registered/found');
      console.log(`User ID: ${data.user.id}`);
      console.log(`Referral code: ${data.user.referral_code}`);
      
      // Now test the check-connection endpoint
      console.log('\n\nTesting check-connection endpoint...');
      const token = Math.random().toString(36).substring(2, 15);
      
      const checkResponse = await fetch(`${API_URL}/check-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'mobile_app_key_here'
        },
        body: JSON.stringify({ token })
      });
      
      const checkData = await checkResponse.json();
      console.log('Check connection response:', checkData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectly();