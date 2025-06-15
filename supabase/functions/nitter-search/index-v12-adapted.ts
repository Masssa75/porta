import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Create Supabase client (exactly like V12)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Get API keys
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
    if (!scraperApiKey) {
      throw new Error('SCRAPERAPI_KEY not configured');
    }

    // Get search parameters from request
    const { projectId, projectName, symbol, twitterHandle } = await req.json();
    
    console.log(`Searching for project: ${projectName} (${symbol})`);
    
    // Build search queries - prioritize specific searches
    const searchQueries = [];
    
    // If we have a twitter handle, search for tweets FROM that account
    if (twitterHandle) {
      searchQueries.push(`from:${twitterHandle}`);
    }
    
    // Search for the symbol with $ (like $KAS)
    searchQueries.push(`$${symbol}`);
    
    // Search for project name
    searchQueries.push(projectName);
    
    const allTweets = [];
    
    // Try each search query
    for (const searchQuery of searchQueries) {
      try {
        console.log(`Searching for: ${searchQuery}`);
        
        // Use ScraperAPI to fetch Nitter data (EXACTLY like V12)
        const targetUrl = `https://nitter.net/search?q=${encodeURIComponent(searchQuery)}&f=tweets`;
        const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(scraperUrl);
        
        if (!response.ok) {
          throw new Error(`ScraperAPI responded with status: ${response.status}`);
        }
        
        const html = await response.text();
        console.log(`Received HTML response, length: ${html.length}`);
        
        // Extract tweet content from Nitter HTML (EXACTLY like V12)
        const tweetMatches = html.matchAll(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
        const tweets = [];
        
        for (const match of tweetMatches) {
          const content = match[1]
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (content && content.length > 20) {
            tweets.push({
              text: content,
              query: searchQuery
            });
          }
          
          if (tweets.length >= 10) break;
        }
        
        console.log(`Found ${tweets.length} tweets for "${searchQuery}"`);
        allTweets.push(...tweets);
        
        // If we found tweets, don't try other searches
        if (tweets.length > 5) {
          break;
        }
      } catch (error) {
        console.error(`Error searching "${searchQuery}":`, error);
      }
    }
    
    // Store results in database
    const storedTweets = [];
    
    for (let i = 0; i < Math.min(allTweets.length, 20); i++) {
      const tweet = allTweets[i];
      try {
        const { data, error } = await supabase
          .from('tweet_analyses')
          .insert({
            project_id: projectId,
            tweet_id: `${projectId}-${Date.now()}-${i}`,
            tweet_text: tweet.text,
            author: tweet.query.startsWith('from:') ? `@${twitterHandle}` : 'Unknown',
            created_at: new Date().toISOString(),
            importance_score: tweet.query.startsWith('from:') ? 8 : 6,
            category: 'general',
            summary: tweet.text.substring(0, 200),
            url: `https://twitter.com/search?q=${encodeURIComponent(tweet.query)}`
          })
          .select();
        
        if (!error && data) {
          storedTweets.push(data[0]);
        }
      } catch (err) {
        console.error('Error storing tweet:', err);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        found: allTweets.length,
        stored: storedTweets.length,
        tweets: allTweets.slice(0, 10)
      }),
      {
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
    
  } catch (error) {
    console.error('Error in nitter-search:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});