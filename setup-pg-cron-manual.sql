-- PORTA pg_cron Setup
-- Run this in Supabase SQL Editor

-- Step 1: Enable Extensions (might already be done)
-- Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/database/extensions
-- Enable: pg_cron and pg_net

-- Step 2: Create the monitoring cron job
SELECT cron.schedule(
  'monitor-projects-roundrobin',  -- job name
  '* * * * *',                    -- every minute
  $$
  SELECT net.http_post(
    url := 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', 'porta-cron-secure-2025'
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'timestamp', now()
    )
  );
  $$
);

-- Step 3: Verify the job was created
SELECT * FROM cron.job;

-- Useful queries:

-- View recent job runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Pause the job (if needed)
-- SELECT cron.unschedule('monitor-projects-roundrobin');

-- Resume the job
-- Just run the schedule command again

-- Check job status
SELECT 
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'monitor-projects-roundrobin';