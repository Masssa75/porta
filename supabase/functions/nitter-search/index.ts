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

interface TweetAnalysis {
  tweet_index: number;
  importance_score: number;
  category: string;
  summary: string;
  is_official: boolean;
  reasoning: string;
}

// Function to analyze multiple tweets in one API call
async function analyzeTweetsBatch(
  tweets: Array<{text: string, is_official: boolean}>,
  projectName: string,
  symbol: string,
  geminiApiKey: string
): Promise<TweetAnalysis[]> {
  // Create a structured prompt for batch analysis
  const tweetsFormatted = tweets.map((t, i) => 
    `Tweet ${i}: "${t.text}" [Official: ${t.is_official}]`
  ).join('\n\n');

  const prompt = `Analyze these cryptocurrency tweets for project ${projectName} (${symbol}):

${tweetsFormatted}

For EACH tweet, provide a JSON array with objects containing:
- tweet_index: The tweet number (0-based)
- importance_score (0-10): Rate the importance for investors/community
  * 9-10: Major announcements (listings on major exchanges, partnerships with Fortune 500, mainnet launches)
  * 7-8: Significant updates (new features, important milestones, major community events)
  * 5-6: Regular updates (minor features, community activities, general news)
  * 3-4: Low importance (retweets, general commentary, minor mentions)
  * 0-2: Noise (spam, unrelated, very minor mentions)
- category: One of: "partnership", "technical", "listing", "community", "price", "general"
- summary: A one-sentence summary (max 200 chars)
- is_official: Boolean from the input
- reasoning: Brief explanation of the score (max 100 chars)

Return ONLY a valid JSON array, no markdown or explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
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
            maxOutputTokens: 2000, // Increased for batch response
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
      const analyses: TweetAnalysis[] = JSON.parse(cleanJson);
      
      // Validate we got analyses for all tweets
      if (!Array.isArray(analyses) || analyses.length !== tweets.length) {
        throw new Error('Invalid response format');
      }
      
      return analyses;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', result);
      // Fallback: create default analyses
      return tweets.map((t, i) => ({
        tweet_index: i,
        importance_score: 5,
        category: 'general',
        summary: t.text.substring(0, 200),
        is_official: t.is_official,
        reasoning: 'AI analysis failed'
      }));
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback for API errors
    return tweets.map((t, i) => ({
      tweet_index: i,
      importance_score: t.is_official ? 6 : 5,
      category: 'general',
      summary: t.text.substring(0, 200),
      is_official: t.is_official,
      reasoning: 'AI unavailable'
    }));
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
    
    // Prepare tweets for batch analysis
    const tweetsToCheck = allTweets.slice(0, 20);
    
    // Check for duplicates BEFORE AI analysis to save costs
    console.log(`Checking ${tweetsToCheck.length} tweets for duplicates...`);
    
    const tweetTexts = tweetsToCheck.map(t => t.text);
    const { data: existingTweets, error: dupCheckError } = await supabase
      .from('tweet_analyses')
      .select('tweet_text')
      .eq('project_id', projectId)
      .in('tweet_text', tweetTexts);
    
    if (dupCheckError) {
      console.error('Error checking duplicates:', dupCheckError);
    }
    
    const existingTexts = new Set(existingTweets?.map(t => t.tweet_text) || []);
    const newTweets = tweetsToCheck.filter(t => !existingTexts.has(t.text));
    const duplicateCount = tweetsToCheck.length - newTweets.length;
    
    console.log(`Found ${duplicateCount} duplicates, ${newTweets.length} new tweets to analyze`);
    
    let analyses: TweetAnalysis[] = [];
    let isAiAnalyzed = false;
    let analysisMetadata: any = {};
    
    // Only analyze NEW tweets with AI
    if (geminiApiKey && newTweets.length > 0) {
      console.log(`Analyzing ${newTweets.length} new tweets in batch...`);
      try {
        analyses = await analyzeTweetsBatch(
          newTweets,
          projectName,
          symbol,
          geminiApiKey
        );
        isAiAnalyzed = true;
        analysisMetadata = {
          model: 'gemini-1.5-flash',
          analyzed_at: new Date().toISOString(),
          tweets_checked: tweetsToCheck.length,
          duplicates_found: duplicateCount,
          new_tweets_analyzed: newTweets.length,
          api_calls: 1
        };
        console.log(`Batch analysis complete. Cost: 1 API call for ${newTweets.length} new tweets (saved ${duplicateCount} duplicate analyses)`);
      } catch (aiError) {
        console.error('AI analysis failed, using fallback:', aiError);
        isAiAnalyzed = false;
        analysisMetadata = {
          error: aiError.message,
          fallback_reason: 'ai_error',
          analyzed_at: new Date().toISOString()
        };
        // Fallback scoring for new tweets only
        analyses = newTweets.map((t, i) => ({
          tweet_index: i,
          importance_score: t.is_official ? 7 : 5,
          category: 'general',
          summary: t.text.substring(0, 200),
          is_official: t.is_official,
          reasoning: 'AI error - fallback scoring'
        }));
      }
    } else {
      // No AI analysis - use basic scoring
      isAiAnalyzed = false;
      analysisMetadata = {
        fallback_reason: geminiApiKey ? (newTweets.length === 0 ? 'all_duplicates' : 'no_new_tweets') : 'no_api_key',
        analyzed_at: new Date().toISOString(),
        tweets_checked: tweetsToCheck.length,
        duplicates_found: duplicateCount,
        new_tweets_analyzed: newTweets.length
      };
      analyses = newTweets.map((t, i) => ({
        tweet_index: i,
        importance_score: t.is_official ? 7 : 5,
        category: 'general',
        summary: t.text.substring(0, 200),
        is_official: t.is_official,
        reasoning: geminiApiKey ? 'No new tweets' : 'No AI API key'
      }));
    }
    
    // Store analyzed tweets (only new ones)
    const storedTweets = [];
    
    for (let i = 0; i < newTweets.length; i++) {
      const tweet = newTweets[i];
      const analysis = analyses.find(a => a.tweet_index === i) || {
        importance_score: 5,
        category: 'general',
        summary: tweet.text.substring(0, 200),
        is_official: tweet.is_official,
        reasoning: 'Analysis not found'
      };
      
      try {
        // No need to check duplicates - we already filtered them out
        const insertData = {
          project_id: projectId,
          tweet_id: `${projectId}-${Date.now()}-${i}`,
          tweet_text: tweet.text,
          author: tweet.is_official ? `@${twitterHandle}` : 'Community',
          created_at: new Date().toISOString(),
          importance_score: analysis.importance_score,
          category: analysis.category,
          summary: analysis.summary,
          url: `https://twitter.com/search?q=${encodeURIComponent(tweet.query)}`,
          is_ai_analyzed: isAiAnalyzed,
          analysis_metadata: analysisMetadata
        };
        
        console.log(`Inserting tweet ${i} (score: ${analysis.importance_score})`);
        
        const { data, error } = await supabase
          .from('tweet_analyses')
          .insert(insertData)
          .select();
        
        if (error) {
          console.error('Insert error:', error);
          continue;
        }
        
        if (data && data[0]) {
          storedTweets.push({
            ...data[0],
            analysis_reasoning: analysis.reasoning,
            is_ai_analyzed: isAiAnalyzed
          });
        }
      } catch (err) {
        console.error('Error storing tweet:', err);
      }
    }
    
    // Check if any high-importance tweets need notifications
    const highImportanceTweets = storedTweets.filter(t => t.importance_score >= 7);
    
    return new Response(
      JSON.stringify({
        success: true,
        found: allTweets.length,
        checked_for_duplicates: tweetsToCheck.length,
        duplicates_skipped: duplicateCount,
        new_tweets_found: newTweets.length,
        analyzed: newTweets.length,
        stored: storedTweets.length,
        high_importance_count: highImportanceTweets.length,
        is_ai_analyzed: isAiAnalyzed,
        analysis_metadata: analysisMetadata,
        api_calls_used: isAiAnalyzed && newTweets.length > 0 ? 1 : 0,
        cost_per_tweet: isAiAnalyzed && newTweets.length > 0 ? (1 / newTweets.length).toFixed(4) : 0,
        tweets: storedTweets.slice(0, 10).map(t => ({
          id: t.id,
          text: t.tweet_text,
          score: t.importance_score,
          category: t.category,
          summary: t.summary,
          reasoning: t.analysis_reasoning,
          is_ai_analyzed: t.is_ai_analyzed
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