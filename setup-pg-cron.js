#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPgCron() {
  console.log('🔧 Setting up pg_cron for porta...\n');

  try {
    // Step 1: Check if extensions are enabled
    console.log('1️⃣ Checking extensions...');
    const { data: extensions, error: extError } = await supabase
      .rpc('pg_available_extensions')
      .select('*')
      .in('name', ['pg_cron', 'pg_net']);

    if (extError) {
      console.log('Cannot check extensions via API');
    }

    // Step 2: Try to create the cron job (if extensions already enabled)
    console.log('\n2️⃣ Attempting to create cron job...');
    
    const cronSql = `
      -- This requires pg_cron and pg_net to be enabled
      SELECT cron.schedule(
        'monitor-projects-every-minute',
        '* * * * *',
        $$
        SELECT net.http_post(
          url := 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-key', 'porta-cron-secure-2025'
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
        $$
      );
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql: cronSql });

    if (error) {
      console.error('❌ Cannot create cron job:', error.message);
      console.log('\n📋 Manual setup required:');
      console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/database/extensions');
      console.log('2. Enable: pg_cron and pg_net extensions');
      console.log('3. Run this SQL in SQL Editor:\n');
      console.log(cronSql);
      
      // Save SQL for manual execution
      require('fs').writeFileSync('./setup-pg-cron.sql', `
-- Enable required extensions (do this in Extensions page first)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job
${cronSql}

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run details (after it runs)
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To remove the job later:
-- SELECT cron.unschedule('monitor-projects-every-minute');
      `);
      
      console.log('\n📄 SQL saved to: setup-pg-cron.sql');
      return false;
    }

    console.log('✅ Cron job created successfully!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run setup
setupPgCron().then(success => {
  if (success) {
    console.log('\n🎉 pg_cron setup complete!');
    console.log('Monitor function will run every minute automatically.');
  } else {
    console.log('\n⚠️  Manual intervention required - see instructions above.');
  }
});