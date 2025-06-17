#!/usr/bin/env node

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🕐 Automated cron-job.org Setup for Porta\n');

// Function to make API request
function createCronJob(apiKey) {
  const data = JSON.stringify({
    job: {
      url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
      enabled: true,
      saveResponses: true,
      title: 'Porta - Monitor Crypto Projects',
      requestMethod: 1, // POST
      extendedData: {
        headers: [
          'x-cron-key: porta-cron-secure-2025',
          'Content-Type: application/json'
        ]
      },
      schedule: {
        timezone: 'UTC',
        minutes: [-1], // Every minute
        hours: [-1],
        mdays: [-1],
        months: [-1],
        wdays: [-1]
      }
    }
  });

  const options = {
    hostname: 'api.cron-job.org',
    port: 443,
    path: '/jobs',
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        if (res.statusCode === 200) {
          console.log('\n✅ Cron job created successfully!');
          console.log(`   Job ID: ${result.jobId}`);
          console.log(`   Title: Porta - Monitor Crypto Projects`);
          console.log(`   Schedule: Every minute`);
          console.log('\n🎉 Your monitoring is now automated!');
          
          // Save config
          require('fs').writeFileSync('./cronjob-config.json', JSON.stringify({
            jobId: result.jobId,
            apiKey: apiKey.substring(0, 8) + '...',
            created: new Date().toISOString(),
            url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects'
          }, null, 2));
          
          console.log('\n📝 Configuration saved to cronjob-config.json');
        } else {
          console.error('\n❌ Failed to create cron job:');
          console.error(result);
        }
      } catch (e) {
        console.error('\n❌ Error:', e.message);
        console.error('Response:', responseData);
      }
      rl.close();
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Request failed: ${e.message}`);
    rl.close();
  });

  req.write(data);
  req.end();
}

// Load from .env if available
require('dotenv').config();

// Main flow
const envApiKey = process.env.CRONJOB_API_KEY;

if (envApiKey && envApiKey !== 'your-cronjob-api-key-here-replace-this') {
  console.log('✅ Using API key from .env file');
  console.log('\n🔄 Creating cron job...');
  createCronJob(envApiKey);
  rl.close();
} else {
  console.log('To get your API key:');
  console.log('1. Go to: https://cron-job.org/en/members/settings/');
  console.log('2. Find the "API" section');
  console.log('3. Copy your API key\n');

  rl.question('Enter your cron-job.org API key: ', (apiKey) => {
    if (!apiKey || apiKey.trim().length < 10) {
      console.error('\n❌ Invalid API key');
      rl.close();
      return;
    }

    console.log('\n🔄 Creating cron job...');
    createCronJob(apiKey.trim());
  });
}