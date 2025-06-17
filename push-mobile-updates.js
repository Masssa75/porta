const { execSync } = require('child_process');
const path = require('path');

async function pushUpdates() {
  console.log('📱 Pushing mobile app updates to GitHub...\n');

  const mobileDir = path.join(__dirname, 'mobile-app');

  try {
    // Copy updated files to temp directory
    console.log('1️⃣ Copying updated files...');
    const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');
    
    // Copy specific updated files
    const filesToCopy = [
      'src/lib/api.ts',
      'src/store/userStore.ts',
      'src/app/page.tsx',
      'src/components/TelegramConnect.tsx',
      'src/components/ReferralSection.tsx'
    ];
    
    for (const file of filesToCopy) {
      const src = path.join(mobileDir, file);
      const dest = path.join(tempDir, file);
      console.log(`Copying ${file}...`);
      execSync(`cp ${src} ${dest}`, { stdio: 'inherit' });
    }

    // Commit and push
    console.log('\n2️⃣ Committing changes...');
    execSync(`cd ${tempDir} && git add -A && git commit -m "Connect mobile app to backend APIs"`, { stdio: 'inherit' });
    
    console.log('\n3️⃣ Pushing to GitHub...');
    execSync(`cd ${tempDir} && git push`, { stdio: 'inherit' });
    
    console.log('\n✅ Updates pushed successfully!');
    console.log('📱 Changes will auto-deploy on Netlify');
    console.log('\n🔄 New features:');
    console.log('- User authentication with Telegram');
    console.log('- Projects save to database');
    console.log('- Referral system connected');
    console.log('- User state persists across sessions');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

pushUpdates();