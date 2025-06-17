const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  console.error('Error: TELEGRAM_BOT_TOKEN not found or not set in .env.local');
  process.exit(1);
}

console.log('🚀 Deploying Telegram notification Edge Function...\n');

// Create the edge function code with the token embedded
const functionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TELEGRAM_BOT_TOKEN = '${TELEGRAM_BOT_TOKEN}'
const TELEGRAM_API_URL = \`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}\`

interface NotificationRequest {
  chatId: string
  message: string
  parseMode?: 'HTML' | 'Markdown'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { chatId, message, parseMode = 'HTML' }: NotificationRequest = await req.json()

    if (!chatId || !message) {
      throw new Error('Missing required fields: chatId and message')
    }

    // Send message via Telegram API
    const response = await fetch(\`\${TELEGRAM_API_URL}/sendMessage\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      throw new Error(\`Telegram API error: \${result.description}\`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.result.message_id 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})`;

// Write the function code
const functionPath = path.join(__dirname, 'supabase/functions/send-telegram-notification/index.ts');
fs.writeFileSync(functionPath, functionCode);

try {
  // Check for Supabase CLI
  try {
    execSync('which supabase', { stdio: 'ignore' });
    console.log('✅ Supabase CLI found');
  } catch {
    console.log('❌ Supabase CLI not found. Using local binary...');
  }

  // First set the TELEGRAM_BOT_TOKEN secret
  console.log('🔐 Setting TELEGRAM_BOT_TOKEN secret...');
  const setSecretCommand = `./supabase-cli/supabase secrets set TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" --project-ref midojobnawatvxhmhmoh`;
  execSync(setSecretCommand, { stdio: 'inherit' });
  
  // Deploy using local Supabase CLI binary
  console.log('📦 Deploying function...');
  const deployCommand = `./supabase-cli/supabase functions deploy send-telegram-notification --project-ref midojobnawatvxhmhmoh`;
  
  execSync(deployCommand, { stdio: 'inherit' });
  
  console.log('\n✅ Telegram notification Edge Function deployed successfully!');
  console.log('Endpoint: https://midojobnawatvxhmhmoh.supabase.co/functions/v1/send-telegram-notification');
  
  // Save deployment info
  const deploymentInfo = {
    telegramFunction: {
      name: 'send-telegram-notification',
      endpoint: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/send-telegram-notification',
      deployedAt: new Date().toISOString()
    }
  };
  
  // Update deployment info file
  let existingInfo = {};
  if (fs.existsSync('deployment-info.json')) {
    existingInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  }
  fs.writeFileSync('deployment-info.json', JSON.stringify({ ...existingInfo, ...deploymentInfo }, null, 2));
  
} catch (error) {
  console.error('Error deploying Edge Function:', error.message);
  process.exit(1);
}