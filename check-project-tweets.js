#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjects() {
  console.log('🔍 Checking monitoring status for your projects...\n');

  // Get all projects
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectError) {
    console.error('Error fetching projects:', projectError);
    return;
  }

  console.log(`Found ${projects.length} projects:\n`);

  for (const project of projects) {
    console.log(`📊 ${project.name} (${project.symbol})`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Added: ${new Date(project.created_at).toLocaleString()}`);
    console.log(`   Last monitored: ${project.last_monitored ? new Date(project.last_monitored).toLocaleString() : 'Not yet'}`);

    // Check tweets for this project
    const { data: tweets, error: tweetError } = await supabase
      .from('tweet_analyses')
      .select('*')
      .eq('project_id', project.id)
      .order('tweet_created_at', { ascending: false })
      .limit(5);

    if (!tweetError && tweets && tweets.length > 0) {
      console.log(`   ✅ Found ${tweets.length} recent tweets:`);
      tweets.forEach((tweet, idx) => {
        console.log(`      ${idx + 1}. ${tweet.author} - Score: ${tweet.importance_score}/10`);
        console.log(`         "${tweet.content.substring(0, 60)}..."`);
        console.log(`         AI: ${tweet.is_ai_analyzed ? '✅' : '❌'}`);
      });
    } else {
      console.log('   ❌ No tweets found yet');
    }
    console.log('');
  }

  // Check recent cron executions
  console.log('📅 Recent monitoring activity:');
  const { data: recentTweets } = await supabase
    .from('tweet_analyses')
    .select('created_at, project_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentTweets && recentTweets.length > 0) {
    console.log(`Last tweet stored: ${new Date(recentTweets[0].created_at).toLocaleString()}`);
  }
}

checkProjects();