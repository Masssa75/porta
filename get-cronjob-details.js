#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const apiKey = process.env.CRONJOB_API_KEY;
const jobId = '6232923';

console.log('📋 Fetching cron job configuration...\n');

const options = {
  hostname: 'api.cron-job.org',
  port: 443,
  path: `/jobs/${jobId}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
};

https.get(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Current job configuration:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.job && result.job.extendedData) {
        console.log('\nHeaders configuration:');
        console.log(JSON.stringify(result.job.extendedData.headers, null, 2));
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
});