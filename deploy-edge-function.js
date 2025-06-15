const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const projectId = process.env.SUPABASE_PROJECT_ID || 'midojobnawatvxhmhmoh';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

console.log('Deploying Edge Function to Supabase...');
console.log('Project ID:', projectId);

// Deploy using curl (since we need authentication)
async function deployEdgeFunction() {
  try {
    // First, let's create a simple deployment using the Management API
    const functionName = 'nitter-search';
    const functionPath = path.join(__dirname, 'supabase', 'functions', functionName);
    
    console.log('\n1. Reading function code...');
    const functionCode = fs.readFileSync(path.join(functionPath, 'index.ts'), 'utf8');
    
    console.log('\n2. Creating deployment package...');
    
    // For now, let's create a manual deployment instruction
    console.log('\n=== Manual Deployment Instructions ===\n');
    console.log('Since automatic deployment requires Supabase login, please deploy manually:');
    console.log('\n1. Go to your Supabase Dashboard:');
    console.log(`   https://app.supabase.com/project/${projectId}/functions`);
    console.log('\n2. Click "New Function"');
    console.log('\n3. Name it: nitter-search');
    console.log('\n4. Copy the code from: supabase/functions/nitter-search/index.ts');
    console.log('\n5. Add the following environment variable:');
    console.log('   SCRAPERAPI_KEY = 43f3f4aa590f2d310b5a70d8a28e94a2');
    console.log('\n6. Deploy the function');
    console.log('\n=== End Instructions ===\n');
    
    // Alternative: Use the Supabase CLI with access token
    console.log('\nAlternatively, you can:');
    console.log('1. Run: npx supabase login');
    console.log('2. Then run: npx supabase functions deploy nitter-search');
    console.log('3. Set secret: npx supabase secrets set SCRAPERAPI_KEY=43f3f4aa590f2d310b5a70d8a28e94a2');
    
  } catch (error) {
    console.error('Deployment error:', error);
  }
}

// Create a simple test script
function createTestScript() {
  const testScript = `
// Test the Edge Function locally
const testEdgeFunction = async () => {
  const response = await fetch('${supabaseUrl}/functions/v1/nitter-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${serviceRoleKey}'
    },
    body: JSON.stringify({
      projectId: 'test-project-id',
      projectName: 'Bitcoin',
      symbol: 'BTC',
      twitterHandle: 'bitcoin',
      timeRange: 'day'
    })
  });
  
  const data = await response.json();
  console.log('Edge Function Response:', data);
};

testEdgeFunction().catch(console.error);
`;

  fs.writeFileSync('test-edge-function.js', testScript);
  console.log('\nCreated test-edge-function.js to test your deployed function');
}

deployEdgeFunction();
createTestScript();