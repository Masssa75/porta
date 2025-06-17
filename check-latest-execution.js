#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const apiKey = process.env.CRONJOB_API_KEY;
const jobId = '6232923';

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
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.history && result.history.length > 0) {
      const latest = result.history[0];
      
      // Get detailed info
      const detailOptions = {
        ...options,
        path: `/jobs/${jobId}/history/${latest.identifier}`
      };
      
      https.get(detailOptions, (detailRes) => {
        let detailData = '';
        detailRes.on('data', (chunk) => { detailData += chunk; });
        detailRes.on('end', () => {
          const details = JSON.parse(detailData);
          console.log('Latest execution details:');
          console.log('Status:', details.jobHistoryDetails.httpStatus);
          console.log('Body:', details.jobHistoryDetails.body);
          
          // Extract request headers from response
          const responseHeaders = details.jobHistoryDetails.headers || '';
          const lines = responseHeaders.split('\\r\\n');
          console.log('\nResponse indicates these headers were received:');
          lines.forEach(line => {
            if (line.includes('x-cron-key') || line.includes('Authorization') || line.includes('apikey')) {
              console.log(' -', line);
            }
          });
          
          // Check actual request details
          console.log('\nFull request URL:', details.jobHistoryDetails.url);
          console.log('Request method:', details.jobHistoryDetails.requestMethod || 'GET');
        });
      });
    }
  });
});