#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = 'midojobnawatvxhmhmoh';

if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

console.log('🔍 Checking Edge Function secrets...\n');

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectId}/secrets`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
};

https.get(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const secrets = JSON.parse(data);
      
      console.log('Current Edge Function secrets:');
      secrets.forEach(secret => {
        console.log(`- ${secret.name}: ${secret.value ? '✅ Set' : '❌ Not set'}`);
      });
      
      // Check for required keys
      const required = ['SCRAPERAPI_KEY', 'GEMINI_API_KEY', 'CRON_SECRET_KEY'];
      const existing = secrets.map(s => s.name);
      
      console.log('\nRequired keys status:');
      required.forEach(key => {
        const exists = existing.includes(key);
        console.log(`- ${key}: ${exists ? '✅ Configured' : '❌ MISSING'}`);
      });
      
    } catch (e) {
      console.error('Error:', e.message);
      console.log('Response:', data);
    }
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
});