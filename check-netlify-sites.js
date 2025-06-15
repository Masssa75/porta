// Check existing Netlify sites
require('dotenv').config();

const https = require('https');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

async function checkNetlifySites() {
  console.log('🔍 Checking your Netlify sites...\n');
  
  const options = {
    hostname: 'api.netlify.com',
    path: '/api/v1/sites',
    headers: {
      'Authorization': `Bearer ${NETLIFY_TOKEN}`
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const sites = JSON.parse(data);
        
        console.log(`Found ${sites.length} sites:\n`);
        
        sites.forEach((site, i) => {
          console.log(`${i + 1}. ${site.name}`);
          console.log(`   URL: https://${site.default_domain}`);
          console.log(`   Created: ${new Date(site.created_at).toLocaleDateString()}`);
          console.log(`   Status: ${site.state}\n`);
        });
        
        const portaSite = sites.find(s => s.name.includes('porta'));
        if (portaSite) {
          console.log(`✅ Found porta site!`);
          console.log(`🌐 Live at: https://${portaSite.default_domain}`);
        }
        
      } catch (error) {
        console.error('Error:', error.message);
      }
    });
  }).on('error', console.error);
}

checkNetlifySites();