const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

console.log('🚀 Deploying Mobile App Edge Functions...\n');

const functions = [
  {
    name: 'telegram-webhook',
    flags: '--no-verify-jwt' // Important for Telegram webhooks
  },
  {
    name: 'api-auth',
    flags: '--no-verify-jwt' // Also needed for mobile app API
  },
  {
    name: 'api-projects',
    flags: '--no-verify-jwt' // Updated for new architecture
  }
];

functions.forEach(func => {
  try {
    console.log(`📦 Deploying ${func.name}...`);
    const cmd = `./supabase-cli/supabase functions deploy ${func.name} --project-ref midojobnawatvxhmhmoh ${func.flags}`.trim();
    
    execSync(cmd, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    console.log(`✅ ${func.name} deployed successfully!\n`);
  } catch (error) {
    console.error(`❌ Failed to deploy ${func.name}:`, error.message);
    process.exit(1);
  }
});

// Set webhook URL for Telegram bot
console.log('\n🔗 Setting Telegram webhook...');
const webhookUrl = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/telegram-webhook';

// Clear any pending updates first
console.log('🧹 Clearing pending updates...');
const clearUpdatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`;
execSync(`curl -s "${clearUpdatesUrl}" > /dev/null`);

// Set the webhook URL with Telegram
const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;

try {
  const response = execSync(`curl -s "${setWebhookUrl}"`);
  const result = JSON.parse(response.toString());
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
  } else {
    console.error('❌ Failed to set webhook:', result.description);
  }
} catch (error) {
  console.error('Error setting webhook:', error.message);
}

console.log('\n🎉 All Edge Functions deployed successfully!');
console.log('\n📱 Mobile app webhook integration complete!');
console.log('🔗 Mobile app: https://portalerts.xyz');
console.log('🤖 Telegram bot: @porta_alerts_bot');