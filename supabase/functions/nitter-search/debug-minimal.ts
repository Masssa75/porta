import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started')
    
    // Test 1: Can we read the request body?
    let body
    try {
      body = await req.json()
      console.log('Body received:', JSON.stringify(body))
    } catch (e) {
      console.error('Failed to parse body:', e)
      throw new Error('Invalid JSON body')
    }
    
    // Test 2: Can we access environment variables?
    const scraperKey = Deno.env.get('SCRAPERAPI_KEY')
    console.log('ScraperAPI key exists:', !!scraperKey)
    
    // Test 3: Can we make a simple fetch?
    try {
      const testUrl = 'https://api.scraperapi.com/account?api_key=' + scraperKey
      console.log('Testing ScraperAPI...')
      const resp = await fetch(testUrl)
      const account = await resp.json()
      console.log('ScraperAPI account:', account)
    } catch (e) {
      console.error('ScraperAPI test failed:', e)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug test completed',
        bodyReceived: body,
        hasApiKey: !!scraperKey
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    
    // Make sure we always return a proper Response
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unknown error',
        stack: error?.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})