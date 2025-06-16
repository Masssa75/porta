require('dotenv').config();

async function fixGeminiKey() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  
  if (!geminiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    return;
  }

  try {
    // First, delete the incorrectly named secret
    console.log('🗑️  Deleting incorrect secret...');
    await fetch(
      'https://api.supabase.com/v1/projects/midojobnawatvxhmhmoh/secrets',
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GEMINI_API_KEY\n']) // Array with the name including newline
      }
    );

    // Add the correct secret
    console.log('✅ Adding correct GEMINI_API_KEY...');
    const response = await fetch(
      'https://api.supabase.com/v1/projects/midojobnawatvxhmhmoh/secrets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          name: 'GEMINI_API_KEY', // Without newline
          value: geminiKey
        }])
      }
    );

    if (response.ok) {
      console.log('✅ GEMINI_API_KEY fixed successfully!');
      console.log('🔄 Wait a minute for the change to propagate, then test again.');
    } else {
      console.error('❌ Failed to add secret:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixGeminiKey();