// Simple script to add Gemini API key to Supabase
const GEMINI_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // <-- Replace this with your actual key

async function addKey() {
  require('dotenv').config();
  
  const response = await fetch(
    'https://api.supabase.com/v1/projects/midojobnawatvxhmhmoh/secrets',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'GEMINI_API_KEY',
        value: GEMINI_KEY
      })
    }
  );

  if (response.ok) {
    console.log('✅ GEMINI_API_KEY added successfully!');
  } else {
    console.error('❌ Failed:', await response.text());
  }
}

if (GEMINI_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error('❌ Please replace YOUR_GEMINI_API_KEY_HERE with your actual key first!');
} else {
  addKey();
}