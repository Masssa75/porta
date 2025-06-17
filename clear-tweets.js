#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearTweets() {
  console.log('🗑️  Clearing tweet_analyses table...\n');

  // First, let's count how many tweets we have
  const { count: beforeCount } = await supabase
    .from('tweet_analyses')
    .select('*', { count: 'exact', head: true });

  console.log(`Found ${beforeCount} tweets to delete.`);

  if (beforeCount > 0) {
    // Delete all tweets
    const { error } = await supabase
      .from('tweet_analyses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible ID)

    if (error) {
      console.error('❌ Error deleting tweets:', error);
      return;
    }

    console.log('✅ All tweets deleted successfully!');
  } else {
    console.log('No tweets to delete.');
  }

  // Also reset last_monitored on projects so they get checked immediately
  console.log('\n🔄 Resetting project monitoring timestamps...');
  
  const { error: updateError } = await supabase
    .from('projects')
    .update({ last_monitored: null })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

  if (!updateError) {
    console.log('✅ Project timestamps reset!');
  }

  console.log('\n🎯 Ready for fresh monitoring!');
  console.log('The next cron run will fetch tweets for all projects.');
}

clearTweets();