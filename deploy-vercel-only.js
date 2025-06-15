// Quick script to deploy only to Vercel
require('dotenv').config();

const { deployToVercel } = require('./setup-autonomous-v2.js');

const githubRepo = {
  id: 1002404705,
  name: 'porta',
  html_url: 'https://github.com/Masssa75/porta'
};

console.log('🚀 Deploying to Vercel...');

deployToVercel(githubRepo)
  .then(result => {
    console.log('\n✅ Vercel deployment successful!');
    console.log(`🌐 Live URL: ${result.url}`);
    console.log(`📊 Dashboard: ${result.dashboard}`);
  })
  .catch(error => {
    console.error('❌ Deployment failed:', error.message);
  });