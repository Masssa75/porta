#!/usr/bin/env node

// Deploy to Netlify using Drop API
require('dotenv').config();

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(`
🚀 Netlify Drop Deployment
=========================

This will create a zip file and deploy directly to Netlify.
`);

async function createZipAndDeploy() {
  try {
    // Step 1: Install archiver if needed
    console.log('📦 Preparing deployment package...');
    try {
      require.resolve('archiver');
    } catch (e) {
      console.log('Installing archiver...');
      execSync('npm install archiver', { stdio: 'inherit' });
    }
    
    const archiver = require('archiver');
    
    // Step 2: Create deployment directory
    const deployDir = path.join(__dirname, 'netlify-deploy');
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }
    
    // Step 3: Copy .next to deploy directory as _next
    console.log('📁 Preparing files...');
    
    // Create index.html that redirects to the app
    const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PortA - Loading...</title>
  <meta http-equiv="refresh" content="0; url=/_next/static/chunks/pages/_app.js">
  <script>window.location.href = '/';</script>
</head>
<body>
  <p>Loading PortA...</p>
</body>
</html>`;
    
    fs.writeFileSync(path.join(deployDir, 'index.html'), indexHtml);
    
    // Create _redirects file for Netlify
    const redirects = `/* /_next/static/chunks/pages/index.js 200`;
    fs.writeFileSync(path.join(deployDir, '_redirects'), redirects);
    
    // Copy .next directory
    copyDirectory('.next', path.join(deployDir, '_next'));
    
    // Step 4: Create zip file
    console.log('📦 Creating deployment package...');
    const output = fs.createWriteStream('porta-deploy.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      
      archive.pipe(output);
      archive.directory(deployDir, false);
      archive.finalize();
    });
    
    console.log('✅ Deployment package created: porta-deploy.zip');
    
    // Step 5: Deploy using Netlify API
    console.log('\n🚀 Deploying to Netlify...');
    
    const deployUrl = await deployToNetlify();
    
    console.log(`\n✅ Deployment successful!`);
    console.log(`🌐 Your site is live at: ${deployUrl}`);
    
    // Cleanup
    fs.rmSync(deployDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    console.log('\n📌 Manual deployment instructions:');
    console.log('1. A file named "porta-deploy.zip" has been created');
    console.log('2. Go to: https://app.netlify.com/drop');
    console.log('3. Drag porta-deploy.zip to the browser');
    console.log('4. Your site will be live instantly!');
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function deployToNetlify() {
  const token = process.env.NETLIFY_TOKEN;
  const zipContent = fs.readFileSync('porta-deploy.zip');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.netlify.com',
      path: '/api/v1/sites',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/zip',
        'Content-Length': zipContent.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const site = JSON.parse(data);
          resolve(`https://${site.subdomain}.netlify.app`);
        } else {
          console.log('API Response:', res.statusCode, data);
          reject(new Error(`Netlify API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(zipContent);
    req.end();
  });
}

// Alternative simple approach
console.log('Alternative: Direct folder upload');
console.log('1. Go to: https://app.netlify.com/drop');
console.log('2. Drag the .next folder from:');
console.log(`   ${path.join(__dirname, '.next')}`);
console.log('3. Drop it in the browser\n');

createZipAndDeploy();