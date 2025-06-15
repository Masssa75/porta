import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectName = "Kaspa" } = await req.json()
    
    // Test 1: Direct Nitter access (no ScraperAPI)
    console.log('Test 1: Direct Nitter access')
    const nitterUrl = `https://nitter.net/search?q=${projectName}&f=tweets`
    
    try {
      const directResponse = await fetch(nitterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      console.log('Direct Nitter status:', directResponse.status)
    } catch (e) {
      console.log('Direct Nitter error:', e.message)
    }
    
    // Test 2: Try alternative approach - search for a known Twitter account
    console.log('Test 2: Search for @KaspaCurrency directly')
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY')
    
    if (!scraperApiKey) {
      return new Response(JSON.stringify({ error: 'No API key' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      })
    }
    
    // Try searching for the Twitter handle directly
    const handleUrl = `https://nitter.net/KaspaCurrency`
    const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(handleUrl)}`
    
    console.log('Fetching profile:', handleUrl)
    
    const response = await fetch(scraperUrl)
    console.log('ScraperAPI status:', response.status)
    
    let result = {
      directNitterWorks: false,
      scraperApiStatus: response.status,
      htmlReceived: false,
      error: null
    }
    
    if (response.ok) {
      const html = await response.text()
      result.htmlReceived = html.length > 1000
      result.htmlLength = html.length
      
      // Check if we got actual Nitter content
      result.isNitterContent = html.includes('timeline-item') || html.includes('tweet-content')
    } else {
      const errorText = await response.text()
      result.error = errorText
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'catch-block'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})