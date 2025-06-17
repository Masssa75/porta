const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local to get the token
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.error('Error: TELEGRAM_BOT_TOKEN not found or not set in .env.local');
  process.exit(1);
}

try {
  console.log('Adding TELEGRAM_BOT_TOKEN to Supabase Edge Functions secrets...');
  
  // Add the secret using Supabase CLI
  const command = `./supabase-cli/supabase secrets set TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" --project-ref midojobnawatvxhmhmoh`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('✅ TELEGRAM_BOT_TOKEN added successfully!');
} catch (error) {
  console.error('Error adding secret:', error.message);
  process.exit(1);
}