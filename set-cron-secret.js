#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔐 Setting CRON_SECRET_KEY for monitor-projects function...\n');

const SECRET_KEY = 'porta-cron-secure-2025';

try {
  // Set the secret using Supabase CLI
  const supabasePath = path.join(__dirname, 'supabase-cli', 'supabase');
  const command = `${supabasePath} secrets set CRON_SECRET_KEY="${SECRET_KEY}" --project-ref midojobnawatvxhmhmoh`;
  
  console.log('Setting secret...');
  execSync(command, {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Secret set successfully!');
  console.log(`   CRON_SECRET_KEY = ${SECRET_KEY}`);
  
  // Save for reference
  require('fs').writeFileSync(
    path.join(__dirname, 'cron-config.json'),
    JSON.stringify({
      secretKey: SECRET_KEY,
      functionUrl: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
      cronJobConfig: {
        url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
        schedule: '* * * * *',
        method: 'POST',
        headers: {
          'x-cron-key': SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    }, null, 2)
  );
  
  console.log('\n📝 Configuration saved to cron-config.json');
  
} catch (error) {
  console.error('❌ Failed to set secret:', error.message);
  process.exit(1);
}