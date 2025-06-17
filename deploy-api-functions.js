const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployAPIFunctions() {
  console.log('🚀 Deploying API Edge Functions...\n');

  try {
    // Deploy auth API
    console.log('1️⃣ Deploying api-auth function...');
    execSync('npx supabase functions deploy api-auth --no-verify-jwt', { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN }
    });

    // Deploy projects API
    console.log('\n2️⃣ Deploying api-projects function...');
    execSync('npx supabase functions deploy api-projects --no-verify-jwt', { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN }
    });

    // Set secrets
    console.log('\n3️⃣ Setting MOBILE_API_KEY secret...');
    execSync('npx supabase secrets set MOBILE_API_KEY=mobile_app_key_here', { 
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN }
    });

    console.log('\n✅ API functions deployed successfully!');
    console.log('\n📝 API Endpoints:');
    console.log('- Auth: https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-auth');
    console.log('- Projects: https://midojobnawatvxhmhmoh.supabase.co/functions/v1/api-projects');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

// Run deployment
deployAPIFunctions();