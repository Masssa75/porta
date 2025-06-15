const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const projectRef = process.env.SUPABASE_PROJECT_ID || 'midojobnawatvxhmhmoh';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const scraperApiKey = process.env.SCRAPERAPI_KEY; // Keep this secure!

async function deployEdgeFunction() {
  console.log('Deploying Edge Function via Supabase Management API...');
  console.log('Project Ref:', projectRef);

  try {
    // First, we need to get a Management API token
    // Since we don't have one, let's create an alternative approach
    
    // Read the function code
    const functionPath = path.join(__dirname, 'supabase', 'functions', 'nitter-search', 'index.ts.edge');
    const functionCode = fs.readFileSync(functionPath, 'utf8');
    
    // Create a deployment using the service role key
    // Note: The Management API requires a special token (sbp_xxx), not the service role key
    // So we'll need to use an alternative approach
    
    console.log('\n=== Deployment Instructions ===\n');
    console.log('The Supabase Management API requires a special access token (sbp_xxx).');
    console.log('To get this token:\n');
    console.log('1. Go to: https://app.supabase.com/account/tokens');
    console.log('2. Click "Generate new token"');
    console.log('3. Give it a name (e.g., "porta-deployment")');
    console.log('4. Copy the token (starts with sbp_)');
    console.log('5. Run this command with your token:\n');
    console.log(`   SUPABASE_ACCESS_TOKEN=sbp_YOUR_TOKEN node deploy-edge-function-api.js\n`);
    
    // Check if we have the token
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    
    if (!accessToken || !accessToken.startsWith('sbp_')) {
      console.log('No valid Supabase access token found.');
      console.log('Please follow the instructions above to get one.\n');
      
      // Create a curl command for manual deployment
      createCurlCommand();
      return;
    }
    
    // If we have a token, proceed with deployment
    console.log('\nAccess token found! Deploying...\n');
    
    const form = new FormData();
    
    // Add metadata
    form.append('metadata', JSON.stringify({
      entrypoint_path: 'index.ts',
      name: 'Nitter Search',
      env_vars: {
        SCRAPERAPI_KEY: scraperApiKey
      }
    }));
    
    // Add the function file
    form.append('file', functionCode, {
      filename: 'index.ts',
      contentType: 'text/typescript'
    });
    
    // Deploy the function
    const response = await axios.post(
      `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=nitter-search`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...form.getHeaders()
        }
      }
    );
    
    console.log('✅ Edge Function deployed successfully!');
    console.log('Response:', response.data);
    
    // Now set the environment variable
    console.log('\nSetting ScraperAPI key...');
    
    // Note: Setting secrets requires a different API endpoint
    // For now, we'll provide instructions
    console.log('\nTo set the ScraperAPI key, run:');
    console.log(`npx supabase secrets set SCRAPERAPI_KEY=${scraperApiKey} --project-ref ${projectRef}`);
    
  } catch (error) {
    if (error.response) {
      console.error('Deployment failed:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

function createCurlCommand() {
  const functionPath = path.join(__dirname, 'supabase', 'functions', 'nitter-search', 'index.ts.edge');
  const functionCode = fs.readFileSync(functionPath, 'utf8');
  
  // Save function to a temp file for curl (in tmp directory to avoid build issues)
  const os = require('os');
  const tempFile = path.join(os.tmpdir(), 'porta-edge-function.ts');
  fs.writeFileSync(tempFile, functionCode);
  
  console.log('\n=== Alternative: Use this curl command ===\n');
  console.log('Replace YOUR_TOKEN with your Supabase access token:\n');
  console.log(`curl --request POST \\
  --url 'https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=nitter-search' \\
  --header 'Authorization: Bearer YOUR_TOKEN' \\
  --header 'content-type: multipart/form-data' \\
  --form 'metadata={"entrypoint_path":"index.ts","name":"Nitter Search"}' \\
  --form file=@${tempFile}`);
  
  console.log('\n=== Or use the Supabase Dashboard ===\n');
  console.log(`https://app.supabase.com/project/${projectRef}/functions\n`);
}

// Check if axios is installed
try {
  require.resolve('axios');
  require.resolve('form-data');
  deployEdgeFunction();
} catch (e) {
  console.log('Installing required dependencies...');
  require('child_process').execSync('npm install axios form-data', { stdio: 'inherit' });
  console.log('\nDependencies installed. Please run the script again.');
}