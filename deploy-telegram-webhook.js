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

console.log('🚀 Deploying Telegram webhook Edge Function...\n');

try {
  // Deploy using local Supabase CLI binary
  console.log('📦 Deploying function...');
  const deployCommand = `./supabase-cli/supabase functions deploy telegram-webhook --project-ref midojobnawatvxhmhmoh`;
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Telegram webhook Edge Function deployed successfully!');
  
  const webhookUrl = 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/telegram-webhook';
  console.log('Webhook URL:', webhookUrl);
  
  // Set the webhook URL with Telegram
  console.log('\n🔗 Setting webhook with Telegram...');
  const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  
  const response = execSync(`curl -s "${setWebhookUrl}"`);
  const result = JSON.parse(response.toString());
  
  if (result.ok) {
    console.log('✅ Webhook set successfully!');
  } else {
    console.error('❌ Failed to set webhook:', result.description);
  }
  
  // Save deployment info
  const deploymentInfo = {
    telegramWebhook: {
      name: 'telegram-webhook',
      endpoint: webhookUrl,
      deployedAt: new Date().toISOString()
    }
  };
  
  // Update deployment info file
  let existingInfo = {};
  if (fs.existsSync('deployment-info.json')) {
    existingInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  }
  fs.writeFileSync('deployment-info.json', JSON.stringify({ ...existingInfo, ...deploymentInfo }, null, 2));
  
  console.log('\n🎉 Telegram bot is now ready to receive commands!');
  console.log('Try sending /start to @porta_alerts_bot');
  
} catch (error) {
  console.error('Error deploying webhook:', error.message);
  process.exit(1);
}