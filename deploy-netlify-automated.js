#!/usr/bin/env node

// Automated Netlify Deployment
require('dotenv').config();

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
const PROJECT_NAME = process.env.PROJECT_NAME || 'porta';
const GITHUB_REPO = `https://github.com/Masssa75/${PROJECT_NAME}`;

console.log(`
🚀 Automated Netlify Deployment
==============================
Project: ${PROJECT_NAME}
GitHub: ${GITHUB_REPO}
`);

async function netlifyAPI(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.netlify.com${endpoint}`);
    
    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`Netlify API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function deployToNetlify() {
  try {
    // Step 1: Build the project
    console.log('📦 Building project...');
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Build complete\n');

    // Step 2: Create a new site
    console.log('🌐 Creating Netlify site...');
    
    const createSiteBody = {
      name: PROJECT_NAME,
      custom_domain: `${PROJECT_NAME}.netlify.app`,
      repo: {
        provider: 'github',
        repo: `Masssa75/${PROJECT_NAME}`,
        branch: 'main',
        cmd: 'npm run build',
        dir: '.next'
      }
    };

    let site;
    try {
      site = await netlifyAPI('/api/v1/sites', {
        method: 'POST',
        body: createSiteBody
      });
      console.log(`✅ Site created: ${site.name}`);
    } catch (error) {
      if (error.message.includes('name already taken')) {
        console.log('⚠️  Site name taken, using random name...');
        delete createSiteBody.name;
        delete createSiteBody.custom_domain;
        site = await netlifyAPI('/api/v1/sites', {
          method: 'POST',
          body: createSiteBody
        });
        console.log(`✅ Site created: ${site.name}`);
      } else {
        throw error;
      }
    }

    // Step 3: Set environment variables
    console.log('\n🔐 Setting environment variables...');
    
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const envLines = envContent.split('\n').filter(line => line.includes('='));
      
      for (const line of envLines) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        
        if (key && value && !key.startsWith('#')) {
          try {
            await netlifyAPI(`/api/v1/sites/${site.id}/env/${key.trim()}`, {
              method: 'PUT',
              body: {
                key: key.trim(),
                value: value.trim()
              }
            });
            console.log(`   ✅ Set ${key.trim()}`);
          } catch (e) {
            console.log(`   ⚠️  Failed to set ${key.trim()}`);
          }
        }
      }
    }

    // Step 4: Trigger deployment
    console.log('\n🚀 Triggering deployment...');
    
    const deploy = await netlifyAPI(`/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      body: {}
    });

    console.log(`\n✅ Deployment started!`);
    console.log(`\n📌 Site URL: https://${site.name}.netlify.app`);
    console.log(`📌 Admin URL: https://app.netlify.com/sites/${site.name}`);
    console.log(`📌 Deploy ID: ${deploy.id}`);
    
    // Save deployment info
    const deploymentInfo = {
      site_id: site.id,
      site_name: site.name,
      site_url: `https://${site.name}.netlify.app`,
      admin_url: `https://app.netlify.com/sites/${site.name}`,
      github_repo: GITHUB_REPO,
      deployed_at: new Date().toISOString()
    };
    
    fs.writeFileSync('netlify-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n✨ Deployment information saved to netlify-deployment.json`);
    
    // Alternative: Using Netlify CLI for easier deployment
    console.log(`\n💡 Alternative: Deploy with Netlify CLI`);
    console.log(`   npm install -g netlify-cli`);
    console.log(`   netlify link --id ${site.id}`);
    console.log(`   netlify deploy --prod`);
    
    return deploymentInfo;

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    // Fallback: Manual zip deployment
    console.log('\n🔧 Fallback: Manual deployment option');
    console.log('1. Your project is built and ready');
    console.log('2. Go to: https://app.netlify.com/drop');
    console.log('3. Drag the `.next` folder to deploy instantly');
    
    throw error;
  }
}

// Run deployment
deployToNetlify()
  .then(result => {
    console.log('\n🎉 SUCCESS! Your app is deploying to Netlify!');
    console.log('It will be live in 1-2 minutes at:', result.site_url);
  })
  .catch(error => {
    console.error('\nDeployment error:', error.message);
  });