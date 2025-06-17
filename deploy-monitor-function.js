#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying monitor-projects Edge Function...\n');

try {
  // Check if Supabase CLI is available
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
  } catch {
    console.log('❌ Supabase CLI not found. Using local binary...');
    // Use the local supabase binary you have
    process.env.PATH = `${path.join(__dirname, 'supabase-cli')}:${process.env.PATH}`;
  }

  // Deploy the function
  console.log('📦 Deploying function...');
  const output = execSync('supabase functions deploy monitor-projects', {
    cwd: __dirname,
    encoding: 'utf8'
  });
  
  console.log(output);
  console.log('✅ Function deployed successfully!');
  
  // Save deployment result
  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    function: 'monitor-projects',
    message: 'Edge Function deployed successfully'
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'monitor-deployment-result.json'),
    JSON.stringify(result, null, 2)
  );

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  const result = {
    success: false,
    timestamp: new Date().toISOString(),
    function: 'monitor-projects',
    error: error.message
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'monitor-deployment-result.json'),
    JSON.stringify(result, null, 2)
  );
  
  process.exit(1);
}