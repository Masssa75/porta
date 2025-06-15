import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectName = "Kaspa" } = await req.json()
    
    console.log(`Testing with project: ${projectName}`)
    
    // Get ScraperAPI key
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY')
    if (!scraperApiKey) {
      throw new Error('SCRAPERAPI_KEY not set')
    }
    
    // Simple test - just try to fetch from Nitter
    const targetUrl = `https://nitter.net/search?q=${projectName}&f=tweets`
    const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`
    
    console.log('Fetching:', scraperUrl)
    
    const response = await fetch(scraperUrl)
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`ScraperAPI error ${response.status}: ${text}`)
    }
    
    const html = await response.text()
    console.log('HTML length:', html.length)
    
    // Simple tweet extraction
    const tweetMatches = html.matchAll(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)
    const tweets = []
    
    for (const match of tweetMatches) {
      const text = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (text && text.length > 20) {
        tweets.push(text)
        if (tweets.length >= 5) break
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        project: projectName,
        tweetsFound: tweets.length,
        tweets: tweets,
        htmlLength: html.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})