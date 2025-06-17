#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const apiKey = process.env.CRONJOB_API_KEY;
const oldJobId = '6232905';

console.log('🔄 Recreating cron job with correct configuration...\n');

// First delete the old job
function deleteJob(callback) {
  const options = {
    hostname: 'api.cron-job.org',
    port: 443,
    path: `/jobs/${oldJobId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Old job deleted');
        callback();
      } else {
        console.error(`❌ Failed to delete job: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });
  req.end();
}

// Create new job
function createNewJob() {
  const data = JSON.stringify({
    job: {
      url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects',
      enabled: true,
      saveResponses: true,
      title: 'Porta - Monitor Crypto Projects v2',
      requestMethod: 1, // POST
      requestTimeout: 30,
      auth: {
        enable: false
      },
      notification: {
        onFailure: true,
        onSuccess: false,
        onDisable: false
      },
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
          console.log('\n✅ New cron job created successfully!');
          console.log(`   Job ID: ${result.jobId}`);
          console.log(`   Headers configured correctly`);
          console.log('\n🎉 Monitoring should work now!');
          
          // Save new config
          require('fs').writeFileSync('./cronjob-config.json', JSON.stringify({
            jobId: result.jobId,
            apiKey: apiKey.substring(0, 8) + '...',
            created: new Date().toISOString(),
            url: 'https://midojobnawatvxhmhmoh.supabase.co/functions/v1/monitor-projects'
          }, null, 2));
          
        } else {
          console.error('\n❌ Failed to create cron job:');
          console.error(result);
        }
      } catch (e) {
        console.error('\n❌ Error:', e.message);
        console.error('Response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Request failed: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Execute
deleteJob(() => {
  setTimeout(() => {
    console.log('\n📝 Creating new job...');
    createNewJob();
  }, 1000);
});