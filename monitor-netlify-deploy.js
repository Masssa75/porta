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

// Monitor deployment
async function monitorDeploy() {
  console.log('🔄 Monitoring Netlify deployment...\n');
  console.log('Waiting for new deployment to start (checking every 10 seconds)...\n');
  
  let lastDeployId = null;
  let deploymentComplete = false;
  let checkCount = 0;
  const maxChecks = 60; // 10 minutes max
  
  const interval = setInterval(async () => {
    checkCount++;
    
    try {
      // First find the site
      const sites = await fetchAPI('/api/v1/sites');
      const site = sites.find(s => s.name && (s.name.includes('porta') || s.url.includes('portax')));
      
      if (!site) {
        console.error('Site not found');
        clearInterval(interval);
        return;
      }
      
      // Get latest deploy
      const deploys = await fetchAPI(`/api/v1/sites/${site.id}/deploys?per_page=1`);
      const latestDeploy = deploys[0];
      
      if (!latestDeploy) return;
      
      // Check if this is a new deployment
      if (lastDeployId !== latestDeploy.id) {
        lastDeployId = latestDeploy.id;
        console.log(`\n🆕 New deployment detected: ${latestDeploy.id}`);
        console.log(`   Branch: ${latestDeploy.branch || 'main'}`);
        console.log(`   Started: ${new Date(latestDeploy.created_at).toLocaleString()}`);
      }
      
      // Show current status
      const statusEmoji = {
        'ready': '✅',
        'building': '🔨',
        'error': '❌',
        'failed': '❌',
        'processing': '⏳',
        'enqueued': '📋',
        'uploading': '📤',
        'uploaded': '📥',
        'preparing': '🔧',
        'prepared': '✔️',
      }[latestDeploy.state] || '❓';
      
      process.stdout.write(`\r${statusEmoji} Status: ${latestDeploy.state.toUpperCase().padEnd(15)} (${checkCount}/${maxChecks})`);
      
      // Check if deployment is complete
      if (latestDeploy.state === 'ready') {
        console.log('\n\n✅ Deployment successful!');
        console.log(`🌐 Live URL: ${latestDeploy.deploy_ssl_url}`);
        console.log(`📊 Admin: ${latestDeploy.admin_url}`);
        deploymentComplete = true;
        clearInterval(interval);
      } else if (latestDeploy.state === 'error' || latestDeploy.state === 'failed') {
        console.log('\n\n❌ Deployment failed!');
        
        // Get detailed error info
        const deployDetails = await fetchAPI(`/api/v1/sites/${site.id}/deploys/${latestDeploy.id}`);
        
        if (deployDetails.error_message) {
          console.log(`\nError: ${deployDetails.error_message}`);
        }
        
        if (deployDetails.log_access_attributes && deployDetails.log_access_attributes.url) {
          console.log(`\n📄 Build logs: ${deployDetails.log_access_attributes.url}`);
        }
        
        deploymentComplete = true;
        clearInterval(interval);
      }
      
    } catch (error) {
      console.error('\nError checking deployment:', error.message);
    }
    
    if (checkCount >= maxChecks && !deploymentComplete) {
      console.log('\n\n⏱️ Timeout reached. Deployment may still be in progress.');
      clearInterval(interval);
    }
    
  }, 10000); // Check every 10 seconds
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

// Start monitoring
monitorDeploy();