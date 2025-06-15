// Manual Vercel deployment
require('dotenv').config();

const https = require('https');

async function checkVercelStatus() {
  const token = process.env.VERCEL_TOKEN;
  const projectName = 'porta';
  
  console.log('🔍 Checking Vercel status...\n');
  
  // Check if project exists
  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${projectName}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const project = JSON.parse(data);
          console.log('✅ Project found on Vercel!');
          console.log(`📌 Project: ${project.name}`);
          console.log(`🔗 Git repo: ${project.link?.type === 'github' ? 'Connected' : 'Not connected'}`);
          
          // Check for deployments
          checkDeployments(token, project.id);
        } else if (res.statusCode === 404) {
          console.log('❌ Project not found on Vercel');
          console.log('\nYou can manually deploy by:');
          console.log('1. Go to https://vercel.com/new');
          console.log('2. Import: https://github.com/Masssa75/porta');
          console.log('3. Add environment variables from .env.local');
        } else {
          console.log('Error:', res.statusCode, data);
        }
      });
    });
    
    req.on('error', console.error);
    req.end();
  });
}

async function checkDeployments(token, projectId) {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v6/deployments?projectId=${projectId}&limit=5`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log(`\n📊 Recent deployments:`);
        
        if (response.deployments && response.deployments.length > 0) {
          response.deployments.forEach((dep, i) => {
            console.log(`\n${i + 1}. ${dep.state} - ${new Date(dep.created).toLocaleString()}`);
            console.log(`   URL: https://${dep.url}`);
            if (dep.state === 'READY') {
              console.log(`   ✅ Live at: https://${dep.url}`);
            }
          });
          
          const latestReady = response.deployments.find(d => d.state === 'READY');
          if (latestReady) {
            console.log(`\n🎉 Your app is LIVE at: https://${latestReady.url}`);
            console.log(`   Production URL: https://porta.vercel.app`);
          }
        } else {
          console.log('No deployments found yet.');
        }
      }
    });
  });
  
  req.on('error', console.error);
  req.end();
}

// Alternative: Direct deployment via CLI
console.log('Alternative: Deploy via Vercel CLI');
console.log('1. Install: npm install -g vercel');
console.log('2. Run: vercel --token ' + process.env.VERCEL_TOKEN?.substring(0, 10) + '...');
console.log('3. Or just run: vercel (and login interactively)\n');

checkVercelStatus();