// Test the duplicate checking logic
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDuplicateLogic() {
  const projectId = '11b4da6c-df34-480e-9c19-89e958c0db34'; // Kaspa
  
  // Get last 5 tweets for this project
  const { data: recentTweets } = await supabase
    .from('tweet_analyses')
    .select('tweet_text')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Recent tweets in DB:', recentTweets?.length || 0);
  
  // Simulate checking new tweets
  const simulatedNewTweets = [
    ...(recentTweets || []).map(t => ({ text: t.tweet_text })), // These should be duplicates
    { text: "This is a completely new tweet about Kaspa!" }, // This is new
    { text: "Another new tweet about $KAS price action" } // This is new
  ];
  
  console.log('Simulated tweets to check:', simulatedNewTweets.length);
  
  // Check for duplicates
  const tweetTexts = simulatedNewTweets.map(t => t.text);
  const { data: existingTweets } = await supabase
    .from('tweet_analyses')
    .select('tweet_text')
    .eq('project_id', projectId)
    .in('tweet_text', tweetTexts);
    
  const existingTexts = new Set(existingTweets?.map(t => t.tweet_text) || []);
  const newTweets = simulatedNewTweets.filter(t => !existingTexts.has(t.text));
  
  console.log('\nResults:');
  console.log('- Duplicates found:', simulatedNewTweets.length - newTweets.length);
  console.log('- New tweets:', newTweets.length);
  console.log('\nCost savings:');
  console.log('- Without optimization: Analyze', simulatedNewTweets.length, 'tweets');
  console.log('- With optimization: Analyze only', newTweets.length, 'tweets');
  console.log('- Saved:', ((simulatedNewTweets.length - newTweets.length) / simulatedNewTweets.length * 100).toFixed(0) + '% API cost');
}

testDuplicateLogic();