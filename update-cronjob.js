#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const apiKey = process.env.CRONJOB_API_KEY;
const jobId = '6232905';

console.log('🔧 Updating cron job configuration...\n');

const data = JSON.stringify({
  job: {
    url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
    enabled: true,
    saveResponses: true,
    title: 'Porta - Monitor Crypto Projects',
    requestMethod: 1, // POST
    extendedData: {
      headers: {
        "1": "x-cron-key: porta-cron-secure-2025",
        "2": "Content-Type: application/json",
        "3": "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZG9qb2JuYXdhdHZ4aG1obW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkwMTUsImV4cCI6MjA2NTU2NTAxNX0.IkMaej6nrxf6XoMyO51vNDw4kvhcNy0Q6yW_jdxZ578",
        "4": "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZG9qb2JuYXdhdHZ4aG1obW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODkwMTUsImV4cCI6MjA2NTU2NTAxNX0.IkMaej6nrxf6XoMyO51vNDw4kvhcNy0Q6yW_jdxZ578"
      },
      body: ''
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
  path: `/jobs/${jobId}`,
  method: 'PATCH',
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
      if (res.statusCode === 200) {
        console.log('✅ Cron job updated successfully!');
        console.log('Headers are now correctly configured.');
        console.log('\n🔄 The job should work on the next run (within 1 minute)');
      } else {
        console.error(`❌ Update failed with status ${res.statusCode}`);
        console.error('Response:', responseData);
      }
    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

req.write(data);
req.end();