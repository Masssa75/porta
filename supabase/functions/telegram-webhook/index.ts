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
  // Allow all requests without auth for Telegram webhook
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Webhook called:', req.method, req.url)
    
    // Verify it's from Telegram (optional security check)
    // In production, you might want to verify the secret token
    
    const update: TelegramUpdate = await req.json()
    console.log('Received update:', JSON.stringify(update))
    
    if (update.message?.text) {
      const chatId = update.message.chat.id
      const text = update.message.text
      const username = update.message.from?.username || update.message.chat.username
      
      // Handle /start command with connection token
      if (text.startsWith('/start')) {
        const token = text.split(' ')[1]
        
        if (token) {
          // Check if user already exists
          let { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_chat_id', chatId)
            .single()
          
          if (!existingUser) {
            // Create new user with the connection token
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                telegram_chat_id: chatId,
                telegram_username: username,
                telegram_verified: true,
                status: 'verified',
                connection_token: token,
                tier: 'free',
                projects_limit: 5,
                referrals_required: 5,
                referrals_completed: 0,
                referral_code: `REF${chatId}${Date.now().toString(36).toUpperCase()}`
              })
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating user:', createError)
              await sendMessage(chatId, '❌ Error creating account. Please try again.')
              return
            }
            
            existingUser = newUser
          } else {
            // Update existing user with new connection token
            await supabase
              .from('users')
              .update({
                connection_token: token,
                telegram_username: username,
                telegram_verified: true
              })
              .eq('id', existingUser.id)
          }
          
          // Send success message for mobile app
          await sendMessage(chatId, 
            `✅ Successfully connected to PortAlerts!\n\n` +
            `You'll now receive notifications about important crypto news.\n\n` +
            `Return to the app to complete setup.`,
            'HTML'
          )
          
          // Also check if this was from the old porta system
          if (token.startsWith('porta_')) {
            // Update the old telegram_connections table too for compatibility
            await supabase
              .from('telegram_connections')
              .update({
                telegram_chat_id: chatId,
                telegram_username: username,
                connected_at: new Date().toISOString()
              })
              .eq('connection_token', token)
              .is('telegram_chat_id', null)
          }
        } else {
          // No token, send welcome message
          await sendMessage(chatId, 
            `👋 Welcome to PortAlerts!\n\n` +
            `To connect this bot to your account:\n` +
            `1. Go to https://portalerts.xyz\n` +
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
        const { data: user } = await supabase
          .from('users')
          .select('*, projects(count)')
          .eq('telegram_chat_id', chatId)
          .single()
        
        if (user) {
          const projectCount = user.projects?.[0]?.count || 0
          await sendMessage(chatId, 
            `📊 Connection Status:\n\n` +
            `✅ Connected as @${user.telegram_username || 'User'}\n` +
            `🎯 Tier: ${user.tier || 'free'}\n` +
            `📁 Monitoring ${projectCount}/${user.projects_limit || 5} projects\n` +
            `👥 Referrals: ${user.referrals_completed || 0}/${user.referrals_required || 5}\n` +
            `🔔 Notification threshold: ${user.notification_threshold || 7}/10\n\n` +
            `Manage settings at: https://portalerts.xyz`
          )
        } else {
          await sendMessage(chatId, '❌ Not connected. Please connect from the PortAlerts app.')
        }
      }
      
      // Handle /settings command
      else if (text === '/settings') {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_chat_id', chatId)
          .single()
        
        if (user) {
          await sendMessage(chatId, 
            `⚙️ Notification Settings:\n\n` +
            `🔔 Notification threshold: ${user.notification_threshold || 7}/10\n` +
            `Only receive alerts for tweets with importance ≥ ${user.notification_threshold || 7}\n\n` +
            `📊 Your limits:\n` +
            `• Projects: ${user.projects_limit || 5} max\n` +
            `• Referrals needed: ${(user.referrals_required || 5) - (user.referrals_completed || 0)} more for unlimited\n\n` +
            `Update settings at: https://portalerts.xyz`
          )
        } else {
          await sendMessage(chatId, '❌ Not connected. Please connect from the PortAlerts app.')
        }
      }
      
      // Handle /help command
      else if (text === '/help') {
        await sendMessage(chatId, 
          `🤖 PortAlerts Bot\n\n` +
          `I send you important crypto news and updates based on AI analysis.\n\n` +
          `Commands:\n` +
          `/status - Check connection status\n` +
          `/settings - View notification settings\n` +
          `/help - Show this message\n\n` +
          `Features:\n` +
          `• AI-powered importance scoring\n` +
          `• Custom notification thresholds\n` +
          `• Track up to 5 projects (free tier)\n` +
          `• Refer friends for unlimited access\n\n` +
          `Manage your projects at:\n` +
          `https://portalerts.xyz`
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