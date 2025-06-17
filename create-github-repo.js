const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function createGitHubRepo() {
  console.log('🚀 Creating GitHub repository via API...\n');

  return new Promise((resolve, reject) => {
    // Read GitHub token
    let token;
    try {
      token = fs.readFileSync(path.join(process.env.HOME, '.github_token'), 'utf8').trim();
    } catch (error) {
      console.error('❌ Could not read GitHub token from ~/.github_token');
      console.log('Please create a personal access token at: https://github.com/settings/tokens');
      reject(error);
      return;
    }

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
          console.log(`📝 Clone URL: ${response.clone_url}`);
          
          // Now push the code
          pushToRepo(response.clone_url);
          resolve(response);
        } else if (res.statusCode === 422 && response.message?.includes('already exists')) {
          console.log('⚠️  Repository already exists, attempting to push...');
          pushToRepo('https://github.com/Masssa75/portalerts-mobile.git');
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

function pushToRepo(cloneUrl) {
  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');
  
  try {
    console.log('\n📤 Pushing code to GitHub...');
    
    // Set remote if not already set
    try {
      execSync(`cd ${tempDir} && git remote add origin ${cloneUrl}`, { stdio: 'pipe' });
    } catch (e) {
      // Remote might already exist, update it
      execSync(`cd ${tempDir} && git remote set-url origin ${cloneUrl}`, { stdio: 'inherit' });
    }
    
    // Push to GitHub
    execSync(`cd ${tempDir} && git push -u origin main`, { stdio: 'inherit' });
    
    console.log('\n✅ Successfully pushed to GitHub!');
    console.log('\n🎉 Mobile app is now on GitHub!');
    console.log('📱 Repository: https://github.com/Masssa75/portalerts-mobile');
    console.log('\n🔗 Next steps for Netlify:');
    console.log('1. Go to Netlify dashboard');
    console.log('2. Click "Add new site" → "Import an existing project"');
    console.log('3. Choose GitHub → Select "portalerts-mobile"');
    console.log('4. Set custom domain to portalerts.xyz');
    console.log('5. Add environment variables:');
    console.log('   NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1');
    console.log('   NEXT_PUBLIC_API_KEY=mobile_app_key_here');
    console.log('   NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot');
    
  } catch (error) {
    console.error('\n❌ Push failed:', error.message);
  }
}

// Run it
createGitHubRepo().catch(console.error);