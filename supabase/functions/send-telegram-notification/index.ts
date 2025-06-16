import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TELEGRAM_BOT_TOKEN = '7822240894:AAG41DArvoxFVT80XqN3T8l0Ph1qkTJ5q-g'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

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
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
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
      throw new Error(`Telegram API error: ${result.description}`)
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
})