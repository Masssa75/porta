import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, projectName, symbol, twitterHandle, timeRange = 'day' } = await req.json()
    
    if (!twitterHandle) {
      throw new Error('Twitter handle is required for this approach')
    }
    
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY')
    if (!scraperApiKey) {
      throw new Error('SCRAPERAPI_KEY not set')
    }
    
    console.log(`Fetching timeline for @${twitterHandle}`)
    
    // Instead of search, fetch the user's timeline directly
    const profileUrl = `https://nitter.net/${twitterHandle}`
    const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(profileUrl)}`
    
    console.log('Fetching profile:', profileUrl)
    
    const response = await fetch(scraperUrl)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ScraperAPI error ${response.status}: ${errorText.substring(0, 200)}`)
    }
    
    const html = await response.text()
    console.log('HTML length:', html.length)
    
    // Extract tweets from timeline
    const tweets = []
    
    // Pattern for timeline tweets (different from search results)
    const tweetPattern = /<div class="timeline-item"[\s\S]*?<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    
    let match
    while ((match = tweetPattern.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (text && text.length > 20) {
        // Check if tweet mentions the project
        const lowerText = text.toLowerCase()
        const isRelevant = 
          lowerText.includes(projectName.toLowerCase()) ||
          lowerText.includes(symbol.toLowerCase()) ||
          lowerText.includes('announcement') ||
          lowerText.includes('update') ||
          lowerText.includes('launch')
        
        tweets.push({
          text: text,
          relevant: isRelevant,
          score: isRelevant ? 8 : 5
        })
        
        if (tweets.length >= 20) break
      }
    }
    
    // If no tweets found with the first pattern, try another
    if (tweets.length === 0) {
      const altPattern = /<div class="tweet-body">[\s\S]*?<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
      while ((match = altPattern.exec(html)) !== null) {
        const text = match[1]
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        
        if (text && text.length > 20) {
          tweets.push({
            text: text,
            relevant: true,
            score: 7
          })
          if (tweets.length >= 10) break
        }
      }
    }
    
    console.log(`Found ${tweets.length} tweets from @${twitterHandle}`)
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Store relevant tweets
    const relevantTweets = tweets.filter(t => t.relevant).slice(0, 10)
    
    for (const tweet of relevantTweets) {
      try {
        await supabase
          .from('tweet_analyses')
          .insert({
            project_id: projectId,
            tweet_id: `${twitterHandle}-${Date.now()}-${Math.random()}`,
            tweet_text: tweet.text.substring(0, 500),
            author: `@${twitterHandle}`,
            created_at: new Date().toISOString(),
            importance_score: tweet.score,
            category: 'official',
            summary: tweet.text.substring(0, 200),
            url: `https://twitter.com/${twitterHandle}`
          })
      } catch (err) {
        console.error('Failed to store tweet:', err)
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        source: 'profile',
        handle: twitterHandle,
        totalTweets: tweets.length,
        relevantTweets: relevantTweets.length,
        tweets: relevantTweets
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
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})