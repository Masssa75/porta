const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function addGeminiKey() {
  try {
    // Get the API key from user
    const geminiKey = await new Promise((resolve) => {
      rl.question('Enter your Gemini API key: ', (answer) => {
        resolve(answer.trim());
      });
    });

    if (!geminiKey || geminiKey.length < 10) {
      console.error('❌ Invalid API key');
      process.exit(1);
    }

    // Get Supabase access token from .env
    require('dotenv').config();
    const supabaseToken = process.env.SUPABASE_ACCESS_TOKEN;
    
    if (!supabaseToken) {
      console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env');
      process.exit(1);
    }

    console.log('🔄 Adding Gemini API key to Supabase secrets...');

    // Add secret via Supabase Management API
    const response = await fetch(
      'https://api.supabase.com/v1/projects/midojobnawatvxhmhmoh/secrets',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'GEMINI_API_KEY',
          value: geminiKey
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add secret: ${error}`);
    }

    console.log('✅ Gemini API key added successfully!');
    
    // Also add to .env for local reference
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnv = envContent.replace(
      /# GEMINI_API_KEY=/,
      `GEMINI_API_KEY=${geminiKey}`
    );
    fs.writeFileSync('.env', updatedEnv);
    console.log('✅ Updated .env file');

    console.log('\n📝 Next steps:');
    console.log('1. Deploy the updated Edge Function with AI analysis');
    console.log('2. Run: npx supabase functions deploy nitter-search');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

addGeminiKey();