const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

// Check webhook status
async function checkWebhook() {
  console.log('🔍 Checking Telegram webhook status...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          console.log('📡 Webhook Info:');
          console.log('================');
          console.log('URL:', info.result.url || 'Not set');
          console.log('Has certificate:', info.result.has_custom_certificate);
          console.log('Pending updates:', info.result.pending_update_count);
          console.log('Max connections:', info.result.max_connections);
          
          if (info.result.last_error_date) {
            const errorDate = new Date(info.result.last_error_date * 1000);
            console.log('\n❌ Last error:');
            console.log('Date:', errorDate.toLocaleString());
            console.log('Message:', info.result.last_error_message);
          }
          
          resolve(info);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get recent updates (messages not handled by webhook)
async function getUpdates() {
  console.log('\n\n📬 Checking recent updates...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const updates = response.result;
          
          if (updates.length > 0) {
            console.log(`Found ${updates.length} unprocessed updates:`);
            updates.forEach((update, index) => {
              if (update.message) {
                console.log(`\n${index + 1}. Message from @${update.message.from.username || 'unknown'}`);
                console.log(`   Chat ID: ${update.message.chat.id}`);
                console.log(`   Text: ${update.message.text}`);
                console.log(`   Date: ${new Date(update.message.date * 1000).toLocaleString()}`);
              }
            });
          } else {
            console.log('No pending updates');
          }
          
          resolve(updates);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Send test message
async function sendTestMessage(chatId) {
  console.log(`\n\n📤 Sending test message to chat ${chatId}...\n`);
  
  return new Promise((resolve, reject) => {
    const message = {
      chat_id: chatId,
      text: '✅ Test message from Porta bot! If you see this, the bot is working.',
      parse_mode: 'HTML'
    };

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.ok) {
            console.log('✅ Message sent successfully!');
          } else {
            console.log('❌ Failed to send:', response.description);
          }
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(message));
    req.end();
  });
}

// Main execution
async function main() {
  try {
    await checkWebhook();
    const updates = await getUpdates();
    
    // If there are unprocessed updates, offer to send test message
    if (updates.length > 0 && updates[0].message) {
      const chatId = updates[0].message.chat.id;
      console.log(`\n💡 Found chat ID: ${chatId}`);
      await sendTestMessage(chatId);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();