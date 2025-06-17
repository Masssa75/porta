const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function pushUpdates() {
  console.log('📱 Pushing mobile app updates to GitHub...\n');

  const mobileDir = path.join(__dirname, 'mobile-app');
  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');

  try {
    // Ensure directories exist
    console.log('1️⃣ Creating necessary directories...');
    execSync(`mkdir -p ${tempDir}/src/store`, { stdio: 'inherit' });
    
    // Copy updated files
    console.log('\n2️⃣ Copying updated files...');
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
      
      // Create directory if it doesn't exist
      const destDir = path.dirname(dest);
      execSync(`mkdir -p ${destDir}`, { stdio: 'pipe' });
      
      console.log(`Copying ${file}...`);
      execSync(`cp "${src}" "${dest}"`, { stdio: 'inherit' });
    }

    // Commit and push
    console.log('\n3️⃣ Committing changes...');
    process.chdir(tempDir);
    execSync('git add -A', { stdio: 'inherit' });
    execSync('git commit -m "Connect mobile app to backend APIs - Enable user auth, project persistence, and referrals"', { stdio: 'inherit' });
    
    console.log('\n4️⃣ Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('\n✅ Updates pushed successfully!');
    console.log('📱 Changes will auto-deploy on Netlify');
    console.log('\n🔄 New features added:');
    console.log('✅ User authentication with Telegram');
    console.log('✅ Projects save to database');
    console.log('✅ Referral system connected');
    console.log('✅ User state persists across sessions');
    console.log('\n⏳ Netlify will deploy in ~2-3 minutes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

pushUpdates();