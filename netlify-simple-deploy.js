#!/usr/bin/env node

// Simple Netlify deployment using CLI approach
require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🚀 Simple Netlify Deployment
===========================
`);

async function deployToNetlify() {
  try {
    // Step 1: Check if netlify CLI is installed
    console.log('📦 Checking Netlify CLI...');
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI found\n');
    } catch (error) {
      console.log('📥 Installing Netlify CLI...');
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
      console.log('✅ Netlify CLI installed\n');
    }

    // Step 2: Create netlify.toml if it doesn't exist
    if (!fs.existsSync('netlify.toml')) {
      console.log('📝 Creating netlify.toml...');
      const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
`;
      fs.writeFileSync('netlify.toml', netlifyConfig);
      console.log('✅ Created netlify.toml\n');
    }

    // Step 3: Build the project if .next doesn't exist
    if (!fs.existsSync('.next')) {
      console.log('🔨 Building project...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build complete\n');
    } else {
      console.log('✅ Build already exists\n');
    }

    // Step 4: Deploy using CLI with auth token
    console.log('🚀 Deploying to Netlify...');
    
    const deployCommand = `NETLIFY_AUTH_TOKEN=${process.env.NETLIFY_TOKEN} netlify deploy --prod --dir=.next --site --json`;
    
    try {
      const output = execSync(deployCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Try to parse JSON output
      try {
        const result = JSON.parse(output);
        console.log('\n✅ Deployment successful!');
        console.log(`🌐 Site URL: ${result.deploy_url || result.url}`);
        console.log(`📊 Admin URL: ${result.admin_url}`);
        
        // Save deployment info
        fs.writeFileSync('netlify-deployment.json', JSON.stringify(result, null, 2));
        
      } catch (parseError) {
        // If not JSON, show raw output
        console.log('\n✅ Deployment complete!');
        console.log(output);
      }
      
    } catch (deployError) {
      // Fallback: Try without --json flag
      console.log('Trying alternative deployment method...');
      
      const altCommand = `NETLIFY_AUTH_TOKEN=${process.env.NETLIFY_TOKEN} netlify deploy --prod --dir=.next --site`;
      const altOutput = execSync(altCommand, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      console.log('\n✅ Deployment complete!');
    }

    // Step 5: List the deployed site
    console.log('\n📋 Checking deployment...');
    const sitesOutput = execSync(`NETLIFY_AUTH_TOKEN=${process.env.NETLIFY_TOKEN} netlify sites:list`, {
      encoding: 'utf8'
    });
    
    console.log('Your Netlify sites:');
    console.log(sitesOutput);
    
  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    
    // Manual fallback
    console.log('\n📌 Manual deployment option:');
    console.log('1. Your project is built in the .next folder');
    console.log('2. Go to: https://app.netlify.com/drop');
    console.log('3. Drag the .next folder to the browser');
    console.log('\nOr try these commands manually:');
    console.log('netlify login');
    console.log('netlify deploy --prod --dir=.next');
  }
}

// Run deployment
deployToNetlify();