#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔧 Running monitoring migration...\n');

  // Check if columns exist first
  const { data: columns } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (columns && columns[0] && !columns[0].hasOwnProperty('last_monitored')) {
    console.log('❌ Missing last_monitored column!');
    console.log('\nPlease run this SQL in Supabase SQL Editor:');
    console.log('https://app.supabase.com/project/midojobnawatvxhmhmoh/sql\n');
    console.log(`-- Add monitoring fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS last_monitored TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 7;

-- Create index for efficient monitoring queries
CREATE INDEX IF NOT EXISTS idx_projects_last_monitored 
ON projects(last_monitored ASC NULLS FIRST);`);
  } else {
    console.log('✅ Monitoring columns already exist!');
    
    // Check project status
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, last_monitored')
      .order('last_monitored', { ascending: true, nullsFirst: true });

    console.log('\nProject monitoring status:');
    projects.forEach(p => {
      console.log(`- ${p.name}: ${p.last_monitored ? 'Last checked ' + new Date(p.last_monitored).toLocaleString() : 'Never monitored'}`);
    });

    // Trigger monitoring for the oldest one
    console.log('\n🔄 Triggering manual monitoring check...');
    const response = await fetch('https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects', {
      method: 'POST',
      headers: {
        'x-cron-key': 'porta-cron-secure-2025',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

    const result = await response.json();
    console.log('Result:', result);
  }
}

runMigration();