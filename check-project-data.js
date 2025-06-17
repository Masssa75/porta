#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjects() {
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('Project details:\n');
  projects.forEach(p => {
    console.log(`${p.name} (${p.symbol})`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Twitter: ${p.twitter_handle || 'NOT SET'}`);
    console.log(`  CoinGecko ID: ${p.coingecko_id || 'NOT SET'}`);
    console.log('');
  });
}

checkProjects();