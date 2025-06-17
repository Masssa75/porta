#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const apiKey = process.env.CRONJOB_API_KEY;
const jobId = '6232923';

console.log('📋 Fetching cron job execution logs...\n');

// Get job history
const options = {
  hostname: 'api.cron-job.org',
  port: 443,
  path: `/jobs/${jobId}/history`,
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
      
      if (result.history && result.history.length > 0) {
        console.log(`Found ${result.history.length} execution records:\n`);
        
        // Get details of the most recent execution
        const latest = result.history[0];
        console.log(`Latest execution:`);
        console.log(`- Time: ${new Date(latest.date * 1000).toLocaleString()}`);
        console.log(`- Status: ${latest.status.status}`);
        console.log(`- HTTP Status: ${latest.httpStatus}`);
        console.log(`- Duration: ${latest.duration}ms`);
        
        // Get full details including response body
        const detailOptions = {
          ...options,
          path: `/jobs/${jobId}/history/${latest.identifier}`
        };
        
        https.get(detailOptions, (detailRes) => {
          let detailData = '';
          
          detailRes.on('data', (chunk) => {
            detailData += chunk;
          });
          
          detailRes.on('end', () => {
            const details = JSON.parse(detailData);
            console.log('\nResponse details:');
            console.log('Request headers sent:', JSON.stringify(details.headers, null, 2));
            if (details.body) {
              console.log('\nResponse body:', details.body);
            }
            console.log('\nFull details:', JSON.stringify(details, null, 2));
          });
        });
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
});