const { execSync } = require('child_process');
const path = require('path');

async function pushToGitHub() {
  console.log('🚀 Pushing mobile app to GitHub...\n');

  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');

  try {
    // Check if directory exists
    console.log('📁 Checking mobile app directory...');
    execSync(`ls -la ${tempDir}`, { stdio: 'inherit' });

    // Push to GitHub
    console.log('\n📤 Pushing to GitHub...');
    execSync(`cd ${tempDir} && git push -u origin main`, { stdio: 'inherit' });

    console.log('\n✅ Successfully pushed to GitHub!');
    console.log('\n🔗 Repository: https://github.com/Masssa75/portalerts-mobile');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Netlify dashboard');
    console.log('2. Click "Add new site" → "Import an existing project"');
    console.log('3. Choose GitHub → Select "portalerts-mobile"');
    console.log('4. Set domain to portalerts.xyz');
    console.log('5. Add these environment variables:');
    console.log('   NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1');
    console.log('   NEXT_PUBLIC_API_KEY=mobile_app_key_here');
    console.log('   NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📝 Manual steps needed:');
    console.log('1. Create new repo at: https://github.com/new');
    console.log('2. Name it: portalerts-mobile');
    console.log('3. In terminal, run:');
    console.log(`   cd ${tempDir}`);
    console.log('   git remote add origin https://github.com/Masssa75/portalerts-mobile.git');
    console.log('   git push -u origin main');
  }
}

// Run it
pushToGitHub();