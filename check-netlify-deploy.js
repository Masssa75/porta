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

// Find the site ID from previous deployments
async function findSiteId() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: '/api/v1/sites',
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
          const sites = JSON.parse(data);
          const portaSite = sites.find(site => 
            site.name && (site.name.includes('porta') || site.url.includes('portax'))
          );
          
          if (portaSite) {
            console.log(`✅ Found site: ${portaSite.name}`);
            console.log(`   URL: ${portaSite.url}`);
            resolve(portaSite.id);
          } else {
            console.log('Available sites:');
            sites.forEach(site => {
              console.log(`- ${site.name}: ${site.url}`);
            });
            reject('Porta site not found');
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get deployment status
async function getLatestDeploy(siteId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${siteId}/deploys?per_page=5`,
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
          const deploys = JSON.parse(data);
          if (deploys && deploys.length > 0) {
            console.log('\n📦 Recent deployments:');
            console.log('=====================');
            
            deploys.forEach((deploy, index) => {
              const time = new Date(deploy.created_at).toLocaleString();
              const status = deploy.state;
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
              }[status] || '❓';
              
              console.log(`\n${index + 1}. ${statusEmoji} ${status.toUpperCase()}`);
              console.log(`   Time: ${time}`);
              console.log(`   Branch: ${deploy.branch || 'main'}`);
              console.log(`   Deploy ID: ${deploy.id}`);
              
              if (deploy.error_message) {
                console.log(`   ❌ Error: ${deploy.error_message}`);
              }
              
              if (deploy.summary && deploy.summary.messages) {
                deploy.summary.messages.forEach(msg => {
                  if (msg.type === 'error') {
                    console.log(`   ❌ Build Error: ${msg.title}`);
                    if (msg.description) {
                      console.log(`      ${msg.description}`);
                    }
                  }
                });
              }
              
              if (index === 0) {
                console.log(`   Deploy URL: ${deploy.deploy_ssl_url}`);
                console.log(`   Admin URL: ${deploy.admin_url}`);
                
                // If latest deploy failed, get the logs
                if (status === 'error' || status === 'failed') {
                  console.log('\n🔍 Getting build logs...');
                  getDeployLog(siteId, deploy.id);
                }
              }
            });
            
            resolve(deploys[0]);
          } else {
            reject('No deployments found');
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Get deployment logs
async function getDeployLog(siteId, deployId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${siteId}/deploys/${deployId}`,
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
          const deploy = JSON.parse(data);
          
          if (deploy.log_access_attributes && deploy.log_access_attributes.url) {
            console.log('\n📄 Build logs available at:');
            console.log(deploy.log_access_attributes.url);
          }
          
          // Show specific error details
          if (deploy.error_message) {
            console.log('\n❌ Deployment Error:');
            console.log(deploy.error_message);
          }
          
          resolve(deploy);
        } catch (e) {
          console.error('Error parsing deploy details:', e);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Main execution
async function checkNetlifyStatus() {
  try {
    console.log('🔍 Checking Netlify deployment status...\n');
    const siteId = await findSiteId();
    await getLatestDeploy(siteId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNetlifyStatus();