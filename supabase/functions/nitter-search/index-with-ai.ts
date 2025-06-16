import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Gemini API types
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface AnalysisResult {
  importance_score: number;
  category: string;
  summary: string;
  is_official: boolean;
  reasoning: string;
}

// Function to analyze tweet with Gemini
async function analyzeTweetWithGemini(
  tweet: string,
  projectName: string,
  symbol: string,
  geminiApiKey: string
): Promise<AnalysisResult> {
  const prompt = `Analyze this cryptocurrency tweet for project ${projectName} (${symbol}):

Tweet: "${tweet}"

Provide a JSON response with:
1. importance_score (0-10): Rate the importance for investors/community
   - 9-10: Major announcements (listings, partnerships with major companies, protocol upgrades)
   - 7-8: Significant updates (new features, important milestones, major community events)
   - 5-6: Regular updates (minor features, community activities, general news)
   - 3-4: Low importance (retweets, general commentary, minor mentions)
   - 0-2: Noise (spam, unrelated, very minor mentions)

2. category: One of: "partnership", "technical", "listing", "community", "price", "general"

3. summary: A one-sentence summary (max 200 chars)

4. is_official: Boolean - is this from an official account or verified source?

5. reasoning: Brief explanation of the score

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const result = data.candidates[0].content.parts[0].text;
    
    try {
      // Clean up the response (remove markdown if any)
      const cleanJson = result.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', result);
      // Fallback analysis
      return {
        importance_score: 5,
        category: 'general',
        summary: tweet.substring(0, 200),
        is_official: false,
        reasoning: 'AI analysis failed, using default scoring'
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback for API errors
    return {
      importance_score: 5,
      category: 'general', 
      summary: tweet.substring(0, 200),
      is_official: false,
      reasoning: 'AI analysis unavailable'
    };
  }
}

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

    // Create Supabase client
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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!scraperApiKey) {
      throw new Error('SCRAPERAPI_KEY not configured');
    }
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Get search parameters from request
    const { projectId, projectName, symbol, twitterHandle } = await req.json();
    
    console.log(`Searching for project: ${projectName} (${symbol})`)
    
    // Build search queries
    const searchQueries = [];
    if (twitterHandle) {
      searchQueries.push(`from:${twitterHandle}`);
    }
    searchQueries.push(`$${symbol}`);
    searchQueries.push(projectName);
    
    const allTweets = [];
    
    // Try each search query
    for (const searchQuery of searchQueries) {
      try {
        console.log(`Searching for: ${searchQuery}`);
        
        const targetUrl = `https://nitter.net/search?q=${encodeURIComponent(searchQuery)}&f=tweets`;
        const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(scraperUrl);
        
        if (!response.ok) {
          throw new Error(`ScraperAPI responded with status: ${response.status}`);
        }
        
        const html = await response.text();
        console.log(`Received HTML response, length: ${html.length}`);
        
        // Extract tweet content from Nitter HTML
        const tweetMatches = html.matchAll(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
        const tweets = [];
        
        for (const match of tweetMatches) {
          const content = match[1]
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (content && content.length > 20) {
            tweets.push({
              text: content,
              query: searchQuery,
              is_official: searchQuery.startsWith('from:')
            });
          }
          
          if (tweets.length >= 10) break;
        }
        
        console.log(`Found ${tweets.length} tweets for "${searchQuery}"`);
        allTweets.push(...tweets);
        
        if (tweets.length > 5) {
          break;
        }
      } catch (error) {
        console.error(`Error searching "${searchQuery}":`, error);
      }
    }
    
    // Analyze and store tweets
    const storedTweets = [];
    const analyzedTweets = [];
    
    // Process tweets in parallel for faster analysis
    const analysisPromises = allTweets.slice(0, 20).map(async (tweet, i) => {
      try {
        // Analyze with Gemini
        const analysis = await analyzeTweetWithGemini(
          tweet.text,
          projectName,
          symbol,
          geminiApiKey
        );
        
        // Check for duplicates before inserting
        const { data: existingTweet } = await supabase
          .from('tweet_analyses')
          .select('id')
          .eq('project_id', projectId)
          .eq('tweet_text', tweet.text)
          .single();
        
        if (existingTweet) {
          console.log(`Skipping duplicate tweet: ${tweet.text.substring(0, 50)}...`);
          return null;
        }
        
        const insertData = {
          project_id: projectId,
          tweet_id: `${projectId}-${Date.now()}-${i}`,
          tweet_text: tweet.text,
          author: tweet.is_official ? `@${twitterHandle}` : 'Community',
          created_at: new Date().toISOString(),
          importance_score: analysis.importance_score,
          category: analysis.category,
          summary: analysis.summary,
          url: `https://twitter.com/search?q=${encodeURIComponent(tweet.query)}`
        };
        
        console.log(`Inserting analyzed tweet ${i} (score: ${analysis.importance_score})`);
        
        const { data, error } = await supabase
          .from('tweet_analyses')
          .insert(insertData)
          .select();
        
        if (error) {
          console.error('Insert error:', error);
          return null;
        }
        
        return {
          ...data[0],
          analysis_reasoning: analysis.reasoning,
          is_official: analysis.is_official
        };
      } catch (err) {
        console.error('Error processing tweet:', err);
        return null;
      }
    });
    
    const results = await Promise.all(analysisPromises);
    const successfulInserts = results.filter(r => r !== null);
    
    // Check if any high-importance tweets need notifications
    const highImportanceTweets = successfulInserts.filter(t => t.importance_score >= 7);
    
    return new Response(
      JSON.stringify({
        success: true,
        found: allTweets.length,
        analyzed: successfulInserts.length,
        stored: successfulInserts.length,
        high_importance_count: highImportanceTweets.length,
        tweets: successfulInserts.slice(0, 10).map(t => ({
          id: t.id,
          text: t.tweet_text,
          score: t.importance_score,
          category: t.category,
          summary: t.summary,
          reasoning: t.analysis_reasoning
        }))
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