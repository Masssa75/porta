const { execSync } = require('child_process');
const path = require('path');

async function createAndPushRepo() {
  console.log('🚀 Creating GitHub repository using gh CLI...\n');

  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');

  try {
    // Check if gh is authenticated
    console.log('🔐 Checking gh CLI authentication...');
    try {
      execSync('gh auth status', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n❌ gh CLI not authenticated.');
      console.log('Please run: gh auth login');
      return;
    }

    // Create repository using gh
    console.log('\n📁 Creating repository...');
    try {
      execSync('gh repo create Masssa75/portalerts-mobile --public --description "Mobile app for PortAlerts crypto notifications"', { stdio: 'inherit' });
      console.log('✅ Repository created!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Repository already exists, continuing...');
      } else {
        throw error;
      }
    }

    // Push code
    console.log('\n📤 Pushing code to GitHub...');
    execSync(`cd ${tempDir} && git remote set-url origin https://github.com/Masssa75/portalerts-mobile.git || git remote add origin https://github.com/Masssa75/portalerts-mobile.git`, { stdio: 'inherit' });
    execSync(`cd ${tempDir} && git push -u origin main`, { stdio: 'inherit' });

    console.log('\n✅ Successfully pushed to GitHub!');
    console.log('📱 Repository: https://github.com/Masssa75/portalerts-mobile');
    console.log('\n🔗 Netlify setup:');
    console.log('1. Import from GitHub → Select "portalerts-mobile"');
    console.log('2. Domain: portalerts.xyz');
    console.log('3. Environment variables:');
    console.log('   NEXT_PUBLIC_API_URL=https://midojobnawatvxhmhmoh.supabase.co/functions/v1');
    console.log('   NEXT_PUBLIC_API_KEY=mobile_app_key_here');
    console.log('   NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback to manual instructions
    console.log('\n📝 Manual steps:');
    console.log('1. Create repo at: https://github.com/new');
    console.log('2. Name: portalerts-mobile');
    console.log('3. Run these commands:');
    console.log(`   cd ${tempDir}`);
    console.log('   git remote add origin https://github.com/Masssa75/portalerts-mobile.git');
    console.log('   git push -u origin main');
  }
}

createAndPushRepo();