// Check Vercel deployment status
require('dotenv').config();

const https = require('https');

async function checkVercelStatus() {
  const token = process.env.VERCEL_TOKEN;
  
  console.log('🔍 Checking Vercel for porta project...\n');
  
  // Check if project exists
  const options = {
    hostname: 'api.vercel.com',
    path: '/v9/projects/porta',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const project = JSON.parse(data);
          console.log('✅ Project found on Vercel!');
          console.log(`📌 Name: ${project.name}`);
          console.log(`🔗 Framework: ${project.framework}`);
          console.log(`📁 Root Directory: ${project.rootDirectory || '(root)'}`);
          
          // Check latest deployments
          checkDeployments(token, project.id);
        } catch (e) {
          console.log('Error parsing response:', e.message);
        }
      } else if (res.statusCode === 404) {
        console.log('❌ Project "porta" not found on Vercel\n');
        
        // List all projects
        console.log('Checking all Vercel projects...');
        listAllProjects(token);
      } else {
        console.log(`Error: ${res.statusCode}`);
        console.log(data);
      }
    });
  }).on('error', console.error);
}

function checkDeployments(token, projectId) {
  const options = {
    hostname: 'api.vercel.com',
    path: `/v6/deployments?projectId=${projectId}&limit=5`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`\n📊 Recent deployments:`);
        
        if (response.deployments && response.deployments.length > 0) {
          response.deployments.forEach((dep, i) => {
            console.log(`\n${i + 1}. ${dep.state}`);
            console.log(`   Created: ${new Date(dep.created).toLocaleString()}`);
            console.log(`   URL: https://${dep.url}`);
            
            if (dep.state === 'READY') {
              console.log(`   ✅ LIVE!`);
            } else if (dep.state === 'ERROR' || dep.state === 'FAILED') {
              console.log(`   ❌ Failed`);
            } else {
              console.log(`   ⏳ ${dep.state}`);
            }
          });
          
          const readyDeploy = response.deployments.find(d => d.state === 'READY');
          if (readyDeploy) {
            console.log(`\n🎉 Your app is LIVE at: https://${readyDeploy.url}`);
            console.log(`🎉 Production URL: https://porta.vercel.app`);
          }
        } else {
          console.log('No deployments found.');
        }
      } catch (e) {
        console.log('Error parsing deployments:', e.message);
      }
    });
  }).on('error', console.error);
}

function listAllProjects(token) {
  const options = {
    hostname: 'api.vercel.com',
    path: '/v9/projects',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`\nFound ${response.projects?.length || 0} Vercel projects:\n`);
        
        response.projects?.forEach((project, i) => {
          console.log(`${i + 1}. ${project.name}`);
          console.log(`   Framework: ${project.framework || 'none'}`);
          console.log(`   Updated: ${new Date(project.updatedAt).toLocaleDateString()}\n`);
        });
      } catch (e) {
        console.log('Error listing projects:', e.message);
      }
    });
  }).on('error', console.error);
}

checkVercelStatus();