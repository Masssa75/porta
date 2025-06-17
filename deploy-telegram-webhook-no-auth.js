const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

console.log('🚀 Deploying Telegram webhook Edge Function (no auth)...\n');

try {
  // Deploy using local Supabase CLI binary with no-verify-jwt flag
  console.log('📦 Deploying function without JWT verification...');
  const deployCommand = `./supabase-cli/supabase functions deploy telegram-webhook --project-ref midojobnawatvxhmhmoh --no-verify-jwt`;
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Telegram webhook Edge Function deployed!');
  
  const webhookUrl = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/telegram-webhook';
  console.log('Webhook URL:', webhookUrl);
  
  // Clear any pending updates first
  console.log('\n🧹 Clearing pending updates...');
  const clearUpdatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`;
  execSync(`curl -s "${clearUpdatesUrl}" > /dev/null`);
  
  // Set the webhook URL with Telegram
  console.log('\n🔗 Setting webhook with Telegram...');
  const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;
  
  const response = execSync(`curl -s "${setWebhookUrl}"`);
  const result = JSON.parse(response.toString());
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log('   Dropped pending updates to start fresh');
  } else {
    console.error('❌ Failed to set webhook:', result.description);
  }
  
  console.log('\n🎉 Telegram bot webhook is ready!');
  console.log('Try sending /start to @porta_alerts_bot again');
  
} catch (error) {
  console.error('Error deploying webhook:', error.message);
  process.exit(1);
}