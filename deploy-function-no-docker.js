#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_PROJECT_ID = 'midojobnawatvxhmhmoh';
const FUNCTION_NAME = 'monitor-projects';

console.log('🚀 Direct Edge Function Deployment (No Docker)\n');

// Read the function code
const functionPath = path.join(__dirname, 'supabase/functions/monitor-projects/index.ts');
const functionCode = fs.readFileSync(functionPath, 'utf8');

console.log(`📄 Function: ${FUNCTION_NAME}`);
console.log(`📏 Code size: ${functionCode.length} bytes\n`);

// Instructions for manual deployment
console.log('Since Docker is not available, please deploy manually:\n');
console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/functions');
console.log('2. Click "New function" → Name it: monitor-projects');
console.log('3. The function code has been copied to your clipboard (if supported)');
console.log('4. Paste the code and deploy\n');

// Try to copy to clipboard (macOS)
try {
  require('child_process').execSync('pbcopy', { input: functionCode });
  console.log('✅ Function code copied to clipboard!');
} catch (e) {
  console.log('📋 Copy the function code from:');
  console.log(`   ${functionPath}`);
}

console.log('\n5. Add this secret in Edge Function settings:');
console.log('   CRON_SECRET_KEY = porta-cron-secure-2025\n');

// Save deployment info
const deploymentInfo = {
  timestamp: new Date().toISOString(),
  function: FUNCTION_NAME,
  projectId: SUPABASE_PROJECT_ID,
  dashboardUrl: `https://app.supabase.com/project/${SUPABASE_PROJECT_ID}/functions`,
  method: 'manual-dashboard',
  dockerRequired: false
};

fs.writeFileSync(
  path.join(__dirname, 'deployment-info.json'),
  JSON.stringify(deploymentInfo, null, 2)
);

console.log('📝 Deployment info saved to deployment-info.json');