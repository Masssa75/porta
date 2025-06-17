#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTweets() {
  // Get total count
  const { count: totalCount } = await supabase
    .from('tweet_analyses')
    .select('*', { count: 'exact', head: true });

  console.log(`Total tweets in database: ${totalCount}`);

  // Get count by project
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, symbol');

  console.log('\nTweets per project:');
  
  for (const project of projects) {
    const { count } = await supabase
      .from('tweet_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project.id);
    
    console.log(`- ${project.name} (${project.symbol}): ${count} tweets`);
  }

  // Check recent tweets
  const { data: recentTweets } = await supabase
    .from('tweet_analyses')
    .select('created_at, author, importance_score')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentTweets && recentTweets.length > 0) {
    console.log('\nMost recent tweets:');
    recentTweets.forEach(t => {
      console.log(`- ${new Date(t.created_at).toLocaleString()} - @${t.author} (score: ${t.importance_score})`);
    });
  }
}

checkTweets();