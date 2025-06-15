import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Nitter instances to try (based on KROMV12)
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.1d4.us',
  'https://nitter.kavin.rocks'
]

interface SearchRequest {
  projectId: string
  projectName: string
  symbol: string
  twitterHandle?: string
  timeRange?: 'hour' | 'day' | 'week'
}

interface Tweet {
  id: string
  text: string
  author: string
  authorHandle: string
  timestamp: string
  likes: number
  retweets: number
  replies: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY')!
    
    if (!scraperApiKey) {
      throw new Error('SCRAPERAPI_KEY environment variable is not set')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { projectId, projectName, symbol, twitterHandle, timeRange = 'day' } = await req.json()

    if (!projectId || !projectName || !symbol) {
      throw new Error('Missing required parameters')
    }

    console.log(`Searching tweets for ${projectName} (${symbol})`)

    // Build search queries
    const searchQueries = []
    
    // Priority 1: Twitter handle
    if (twitterHandle) {
      searchQueries.push(`from:${twitterHandle}`)
      searchQueries.push(`@${twitterHandle}`)
    }
    
    // Priority 2: Symbol mentions
    searchQueries.push(`$${symbol}`)
    searchQueries.push(`#${symbol}`)
    
    // Priority 3: Project name
    searchQueries.push(`"${projectName}"`)

    // Collect all tweets
    const allTweets: Tweet[] = []
    const errors: string[] = []

    // Try each search query
    for (const query of searchQueries) {
      try {
        const tweets = await searchNitter(query, scraperApiKey, timeRange)
        allTweets.push(...tweets)
      } catch (error) {
        errors.push(`Failed to search "${query}": ${error.message}`)
      }
    }

    // Deduplicate tweets by ID
    const uniqueTweets = Array.from(
      new Map(allTweets.map(tweet => [tweet.id, tweet])).values()
    )

    // Sort by timestamp (newest first)
    uniqueTweets.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Limit to 20 most recent tweets
    const topTweets = uniqueTweets.slice(0, 20)

    // Store tweets in database
    for (const tweet of topTweets) {
      try {
        // Check if tweet already exists
        const { data: existing } = await supabase
          .from('tweet_analyses')
          .select('id')
          .eq('tweet_id', tweet.id)
          .single()

        if (!existing) {
          // Insert new tweet
          await supabase
            .from('tweet_analyses')
            .insert({
              project_id: projectId,
              tweet_id: tweet.id,
              tweet_text: tweet.text,
              author: `${tweet.author} (@${tweet.authorHandle})`,
              created_at: tweet.timestamp,
              importance_score: calculateImportanceScore(tweet, twitterHandle),
              category: categorizeText(tweet.text),
              summary: tweet.text.substring(0, 200),
              url: `https://twitter.com/${tweet.authorHandle}/status/${tweet.id}`
            })
        }
      } catch (error) {
        console.error(`Failed to store tweet ${tweet.id}:`, error)
      }
    }

    // Log the search
    await supabase
      .from('monitoring_logs')
      .insert({
        project_id: projectId,
        source: 'nitter_search',
        tweets_found: topTweets.length,
        error: errors.length > 0 ? errors.join('; ') : null
      })

    return new Response(
      JSON.stringify({
        success: true,
        tweets: topTweets,
        count: topTweets.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function searchNitter(query: string, apiKey: string, timeRange: string): Promise<Tweet[]> {
  const encodedQuery = encodeURIComponent(query)
  
  // Try each Nitter instance
  for (const instance of NITTER_INSTANCES) {
    try {
      const targetUrl = `${instance}/search?q=${encodedQuery}&f=tweets`
      const scraperUrl = `https://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`
      
      console.log(`Trying ${instance} with query: ${query}`)
      
      const response = await fetch(scraperUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const tweets = parseNitterHtml(html)
      
      if (tweets.length > 0) {
        console.log(`Found ${tweets.length} tweets from ${instance}`)
        return tweets
      }
    } catch (error) {
      console.error(`Failed with ${instance}:`, error.message)
      continue
    }
  }
  
  throw new Error('All Nitter instances failed')
}

function parseNitterHtml(html: string): Tweet[] {
  const tweets: Tweet[] = []
  
  // Regex patterns for extracting tweet data
  const tweetPattern = /<div class="timeline-item"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi
  const textPattern = /<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  const authorPattern = /<a class="fullname"[^>]*>([^<]+)<\/a>/i
  const handlePattern = /<a class="username"[^>]*>@([^<]+)<\/a>/i
  const timestampPattern = /<span class="tweet-date"[^>]*>([^<]+)<\/span>/i
  const statsPattern = /<span class="tweet-stat"[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/span>/gi
  const idPattern = /href="\/[^\/]+\/status\/(\d+)"/i
  
  let match
  while ((match = tweetPattern.exec(html)) !== null) {
    try {
      const tweetHtml = match[1]
      
      const textMatch = textPattern.exec(tweetHtml)
      const authorMatch = authorPattern.exec(tweetHtml)
      const handleMatch = handlePattern.exec(tweetHtml)
      const timestampMatch = timestampPattern.exec(tweetHtml)
      const idMatch = idPattern.exec(tweetHtml)
      
      if (textMatch && authorMatch && handleMatch && idMatch) {
        // Extract stats
        const stats = []
        let statMatch
        while ((statMatch = statsPattern.exec(tweetHtml)) !== null) {
          stats.push(parseInt(statMatch[1]) || 0)
        }
        
        tweets.push({
          id: idMatch[1],
          text: cleanHtml(textMatch[1]),
          author: authorMatch[1].trim(),
          authorHandle: handleMatch[1].trim(),
          timestamp: parseTimestamp(timestampMatch?.[1] || 'now'),
          replies: stats[0] || 0,
          retweets: stats[1] || 0,
          likes: stats[2] || 0
        })
      }
    } catch (error) {
      console.error('Error parsing tweet:', error)
    }
  }
  
  return tweets
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

function parseTimestamp(timestamp: string): string {
  // Nitter uses relative timestamps like "5m", "2h", "3d"
  const now = new Date()
  
  if (timestamp.includes('s')) {
    const seconds = parseInt(timestamp) || 0
    now.setSeconds(now.getSeconds() - seconds)
  } else if (timestamp.includes('m')) {
    const minutes = parseInt(timestamp) || 0
    now.setMinutes(now.getMinutes() - minutes)
  } else if (timestamp.includes('h')) {
    const hours = parseInt(timestamp) || 0
    now.setHours(now.getHours() - hours)
  } else if (timestamp.includes('d')) {
    const days = parseInt(timestamp) || 0
    now.setDate(now.getDate() - days)
  }
  
  return now.toISOString()
}

function calculateImportanceScore(tweet: Tweet, officialHandle?: string): number {
  let score = 5 // Base score
  
  // Official account gets higher score
  if (officialHandle && tweet.authorHandle.toLowerCase() === officialHandle.toLowerCase()) {
    score += 3
  }
  
  // Engagement metrics
  if (tweet.likes > 100) score += 1
  if (tweet.likes > 1000) score += 1
  if (tweet.retweets > 50) score += 1
  
  // Keywords that indicate importance
  const importantKeywords = ['announcement', 'update', 'launch', 'release', 'partnership', 'listing']
  const text = tweet.text.toLowerCase()
  if (importantKeywords.some(keyword => text.includes(keyword))) {
    score += 1
  }
  
  return Math.min(score, 10)
}

function categorizeText(text: string): string {
  const lower = text.toLowerCase()
  
  if (lower.includes('partnership') || lower.includes('collaborate')) {
    return 'partnership'
  } else if (lower.includes('update') || lower.includes('upgrade') || lower.includes('release')) {
    return 'technical'
  } else if (lower.includes('list') || lower.includes('exchange')) {
    return 'listing'
  } else if (lower.includes('price') || lower.includes('ath') || lower.includes('pump')) {
    return 'price'
  } else if (lower.includes('community') || lower.includes('ama') || lower.includes('event')) {
    return 'community'
  }
  
  return 'general'
}