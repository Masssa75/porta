require('dotenv').config();
const { execSync } = require('child_process');
const https = require('https');
const path = require('path');

async function createGitHubRepo() {
  console.log('🚀 Creating GitHub repository via API...\n');

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found in .env file');
    return;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: 'portalerts-mobile',
      description: 'Mobile app for PortAlerts crypto notifications',
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'PortAlerts-App',
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        const response = JSON.parse(responseData);
        
        if (res.statusCode === 201) {
          console.log('✅ Repository created successfully!');
          console.log(`📎 URL: ${response.html_url}`);
          pushToRepo();
          resolve(response);
        } else if (res.statusCode === 422 && response.message?.includes('already exists')) {
          console.log('⚠️  Repository already exists, attempting to push...');
          pushToRepo();
          resolve(response);
        } else {
          console.error('❌ Failed to create repository:', response.message || response);
          reject(new Error(response.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function pushToRepo() {
  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');
  
  try {
    console.log('\n📤 Pushing code to GitHub...');
    
    // Set remote
    try {
      execSync(`cd ${tempDir} && git remote add origin https://github.com/Masssa75/portalerts-mobile.git`, { stdio: 'pipe' });
    } catch (e) {
      execSync(`cd ${tempDir} && git remote set-url origin https://github.com/Masssa75/portalerts-mobile.git`, { stdio: 'inherit' });
    }
    
    // Push
    execSync(`cd ${tempDir} && git push -u origin main`, { stdio: 'inherit' });
    
    console.log('\n✅ Successfully pushed to GitHub!');
    console.log('📱 Repository: https://github.com/Masssa75/portalerts-mobile');
    console.log('\n🔗 Netlify setup:');
    console.log('1. Import "portalerts-mobile" from GitHub');
    console.log('2. Domain: portalerts.xyz');
    console.log('3. Environment variables:');
    console.log('   NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1');
    console.log('   NEXT_PUBLIC_API_KEY=mobile_app_key_here');
    console.log('   NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot');
    
  } catch (error) {
    console.error('\n❌ Push failed:', error.message);
  }
}

// Run it
createGitHubRepo().catch(console.error);