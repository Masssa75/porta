#!/usr/bin/env node

// Netlify deployment - Often simpler than Vercel!
require('dotenv').config();

const https = require('https');
const fs = require('fs');

console.log(`
🚀 Netlify Deployment Setup
==========================

Netlify advantages:
✅ Simpler API
✅ Automatic deploys from GitHub
✅ Free tier is generous
✅ Better build logs
✅ Easy rollbacks
`);

async function deployToNetlify() {
  // Option 1: Using Netlify CLI (Simplest!)
  console.log('Option 1: Netlify CLI (Recommended)\n');
  console.log('1. Install Netlify CLI:');
  console.log('   npm install -g netlify-cli\n');
  
  console.log('2. Login to Netlify:');
  console.log('   netlify login\n');
  
  console.log('3. Deploy with one command:');
  console.log('   netlify deploy --prod --dir=.next\n');
  
  console.log('4. Or link to GitHub for auto-deploy:');
  console.log('   netlify init\n');

  // Option 2: Drop-in deployment via Netlify Drop
  console.log('\n─────────────────────────────\n');
  console.log('Option 2: Netlify Drop (No CLI needed!)\n');
  console.log('1. Build your project:');
  console.log('   npm run build\n');
  
  console.log('2. Go to: https://app.netlify.com/drop');
  console.log('3. Drag the `.next` folder to the browser');
  console.log('4. Done! Instant deployment\n');

  // Option 3: API deployment
  console.log('\n─────────────────────────────\n');
  console.log('Option 3: Direct GitHub Integration\n');
  console.log('1. Go to: https://app.netlify.com/start');
  console.log('2. Click "Import from Git"');
  console.log('3. Choose: https://github.com/Masssa75/porta');
  console.log('4. Auto-detects Next.js settings');
  console.log('5. Click Deploy!\n');

  // Create netlify.toml for perfect Next.js config
  const netlifyConfig = `# Netlify configuration for Next.js
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"

# Essential for Next.js on Netlify
[[plugins]]
  package = "@netlify/plugin-nextjs"

# Redirects for Next.js
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/___netlify-handler"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
`;

  fs.writeFileSync('netlify.toml', netlifyConfig);
  console.log('✅ Created netlify.toml with Next.js configuration\n');

  // Environment variables setup
  console.log('Environment Variables:\n');
  console.log('Add these in Netlify dashboard (Site settings → Environment variables):');
  
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = envContent.split('\n').filter(line => line.includes('='));
    
    envVars.forEach(line => {
      const [key] = line.split('=');
      if (key && !key.startsWith('#')) {
        console.log(`- ${key.trim()}`);
      }
    });
  }

  console.log('\n🎯 Why Netlify might be better for your use case:');
  console.log('- No complex "root directory" issues');
  console.log('- GitHub integration "just works"');
  console.log('- Build logs are clearer');
  console.log('- Free tier includes 300 build minutes/month');
  console.log('- Automatic HTTPS with custom domains');
}

// Create automated Netlify deployment
async function automatedNetlifyDeploy() {
  console.log('\n─────────────────────────────\n');
  console.log('🤖 Automated Netlify Deployment\n');
  
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  
  if (!NETLIFY_TOKEN) {
    console.log('To enable automated deployment:');
    console.log('1. Get token from: https://app.netlify.com/user/applications#personal-access-tokens');
    console.log('2. Add to .env: NETLIFY_TOKEN=your-token-here');
    console.log('3. Run this script again\n');
    return;
  }

  // This would create site and deploy via API
  console.log('✅ Token found! Ready for automated deployment');
  console.log('(Implementation for full automation can be added)');
}

deployToNetlify();
automatedNetlifyDeploy();