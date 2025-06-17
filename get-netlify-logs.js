const https = require('https');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;

if (!NETLIFY_TOKEN) {
  console.error('❌ NETLIFY_TOKEN not found in environment');
  process.exit(1);
}

async function getDeployLogs() {
  try {
    // First find the site
    const sites = await fetchAPI('/api/v1/sites');
    const site = sites.find(s => s.name && (s.name.includes('porta') || s.url.includes('portax')));
    
    if (!site) {
      console.error('Site not found');
      return;
    }
    
    console.log(`📦 Site: ${site.name}`);
    console.log(`🌐 URL: ${site.url}\n`);
    
    // Get latest deploy
    const deploys = await fetchAPI(`/api/v1/sites/${site.id}/deploys?per_page=1`);
    const latestDeploy = deploys[0];
    
    if (!latestDeploy) {
      console.error('No deployments found');
      return;
    }
    
    console.log(`📋 Latest Deploy: ${latestDeploy.id}`);
    console.log(`📊 Status: ${latestDeploy.state}`);
    console.log(`🕐 Time: ${new Date(latestDeploy.created_at).toLocaleString()}\n`);
    
    // Get deploy details with log access
    const deployDetails = await fetchAPI(`/api/v1/sites/${site.id}/deploys/${latestDeploy.id}`);
    
    // Check for build command output
    if (deployDetails.summary && deployDetails.summary.messages) {
      console.log('📝 Build Messages:');
      console.log('==================');
      deployDetails.summary.messages.forEach(msg => {
        const emoji = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`\n${emoji} ${msg.type.toUpperCase()}: ${msg.title}`);
        if (msg.description) {
          console.log(`   ${msg.description}`);
        }
        if (msg.details) {
          console.log(`   Details: ${msg.details}`);
        }
      });
    }
    
    // Try to get actual build logs
    if (deployDetails.log_access_attributes && deployDetails.log_access_attributes.url) {
      console.log('\n\n📄 Full Build Logs:');
      console.log('===================');
      
      // Fetch the actual logs
      const logsResponse = await fetch(deployDetails.log_access_attributes.url);
      const logs = await logsResponse.text();
      
      // Show last 50 lines or lines with errors
      const logLines = logs.split('\n');
      const errorLines = logLines.filter(line => 
        line.includes('error') || 
        line.includes('Error') || 
        line.includes('ERROR') ||
        line.includes('failed') ||
        line.includes('Failed') ||
        line.includes('Module not found') ||
        line.includes('Cannot find')
      );
      
      if (errorLines.length > 0) {
        console.log('\n🔍 Error lines found:');
        errorLines.forEach(line => console.log(line));
      } else {
        console.log('\nLast 30 lines of build log:');
        logLines.slice(-30).forEach(line => console.log(line));
      }
      
      // Save full logs to file
      fs.writeFileSync('netlify-build-log.txt', logs);
      console.log('\n💾 Full logs saved to: netlify-build-log.txt');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Helper function to make API calls
function fetchAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run
getDeployLogs();