const https = require('https');

async function checkDeployStatus() {
  console.log('🔍 Checking deployment status...\n');

  // Check both URLs
  const urls = [
    'https://portalerts.xyz',
    'https://portalerts-mobile.netlify.app'
  ];

  for (const url of urls) {
    console.log(`Checking ${url}...`);
    
    await new Promise((resolve) => {
      https.get(url, (res) => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Site is accessible\n');
        } else if (res.statusCode >= 500) {
          console.log('❌ Server error - deployment likely failed\n');
        } else if (res.statusCode >= 400) {
          console.log('⚠️  Client error - possible build issue\n');
        }
        
        resolve();
      }).on('error', (err) => {
        console.error(`❌ Error: ${err.message}\n`);
        resolve();
      });
    });
  }

  console.log('📝 Common deployment failure reasons:');
  console.log('1. Missing dependencies in package.json');
  console.log('2. TypeScript errors');
  console.log('3. Build command issues');
  console.log('4. Environment variable problems');
  console.log('\n💡 Check Netlify dashboard for detailed build logs');
}

checkDeployStatus();