import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TelegramUpdate {
  message?: {
    chat: {
      id: number
      username?: string
    }
    text?: string
    from?: {
      username?: string
    }
  }
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
    const update: TelegramUpdate = await req.json()
    
    if (update.message?.text) {
      const chatId = update.message.chat.id
      const text = update.message.text
      const username = update.message.from?.username || update.message.chat.username
      
      // Handle /start command with connection token
      if (text.startsWith('/start')) {
        const token = text.split(' ')[1]
        
        if (token && token.startsWith('porta_')) {
          // Update the connection with telegram chat ID
          const { error } = await supabase
            .from('telegram_connections')
            .update({
              telegram_chat_id: chatId,
              telegram_username: username,
              connected_at: new Date().toISOString()
            })
            .eq('connection_token', token)
            .is('telegram_chat_id', null)
          
          if (!error) {
            // Send success message with link back to app
            await sendMessage(chatId, 
              `✅ Successfully connected to Porta!\n\n` +
              `You'll now receive notifications about important crypto news.\n\n` +
              `<a href="https://portax.netlify.app?telegram_connected=true&token=${token}">Click here to return to Porta</a>`,
              'HTML'
            )
          } else {
            await sendMessage(chatId, '❌ Invalid or expired connection token. Please try again from the Porta app.')
          }
        } else {
          // No token, send welcome message
          await sendMessage(chatId, 
            `👋 Welcome to Porta Alerts!\n\n` +
            `To connect this bot to your Porta account:\n` +
            `1. Go to https://portax.netlify.app\n` +
            `2. Click "Connect Telegram"\n` +
            `3. Follow the instructions\n\n` +
            `Available commands:\n` +
            `/status - Check connection status\n` +
            `/settings - View notification settings\n` +
            `/help - Show this message`
          )
        }
      }
      
      // Handle /status command
      else if (text === '/status') {
        const { data } = await supabase
          .from('telegram_connections')
          .select('*, projects(count)')
          .eq('telegram_chat_id', chatId)
          .single()
        
        if (data) {
          const projectCount = data.projects?.[0]?.count || 0
          await sendMessage(chatId, 
            `📊 Connection Status:\n\n` +
            `✅ Connected\n` +
            `📁 Monitoring ${projectCount} projects\n` +
            `🔔 Threshold: ${data.notification_preferences?.threshold || 7}/10\n\n` +
            `Manage settings at: https://portax.netlify.app`
          )
        } else {
          await sendMessage(chatId, '❌ Not connected. Please connect from the Porta app.')
        }
      }
      
      // Handle /settings command
      else if (text === '/settings') {
        const { data } = await supabase
          .from('telegram_connections')
          .select('notification_preferences')
          .eq('telegram_chat_id', chatId)
          .single()
        
        if (data) {
          const prefs = data.notification_preferences
          await sendMessage(chatId, 
            `⚙️ Notification Settings:\n\n` +
            `${prefs.important_tweets ? '✅' : '❌'} Important tweets (≥${prefs.threshold})\n` +
            `${prefs.ai_analysis ? '✅' : '❌'} AI analysis summaries\n` +
            `${prefs.daily_digest ? '✅' : '❌'} Daily digest\n\n` +
            `Update settings at: https://portax.netlify.app`
          )
        } else {
          await sendMessage(chatId, '❌ Not connected. Please connect from the Porta app.')
        }
      }
      
      // Handle /help command
      else if (text === '/help') {
        await sendMessage(chatId, 
          `🤖 Porta Alerts Bot\n\n` +
          `I send you important crypto news and updates based on AI analysis.\n\n` +
          `Commands:\n` +
          `/status - Check connection status\n` +
          `/settings - View notification settings\n` +
          `/help - Show this message\n\n` +
          `Manage your projects and settings at:\n` +
          `https://portax.netlify.app`
        )
      }
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function sendMessage(chatId: number, text: string, parseMode?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false
    })
  })
}