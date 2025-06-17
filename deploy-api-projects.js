const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

console.log('🚀 Deploying updated api-projects Edge Function...\n');

try {
  // Deploy using local Supabase CLI binary with no-verify-jwt flag
  console.log('📦 Deploying function without JWT verification...');
  const deployCommand = `./supabase-cli/supabase functions deploy api-projects --project-ref midojobnawatvxhmhmoh --no-verify-jwt`;
  
  execSync(deployCommand, { 
    cwd: __dirname,
    stdio: 'inherit' 
  });
  
  console.log('\n✅ api-projects Edge Function deployed!');
  console.log('\n📋 New endpoints available:');
  console.log('   GET  /api-projects/available - List all projects');
  console.log('   GET  /api-projects/subscribed - User\'s subscribed projects');
  console.log('   POST /api-projects/subscribe - Subscribe to a project');
  console.log('   POST /api-projects/unsubscribe - Unsubscribe from project');
  console.log('   PUT  /api-projects/update-threshold - Update notification threshold');
  
} catch (error) {
  console.error('Error deploying function:', error.message);
  process.exit(1);
}