const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Pushing Mobile App Updates...\n');

const mobileRepoPath = path.join(process.env.HOME, 'Desktop/projects/portalerts-mobile-temp');
const mobileAppPath = path.join(__dirname, 'mobile-app');

try {
  // Copy updated files
  console.log('📦 Copying updated mobile app files...');
  
  // Copy the updated TelegramConnect component
  fs.copyFileSync(
    path.join(mobileAppPath, 'src/components/TelegramConnect.tsx'),
    path.join(mobileRepoPath, 'src/components/TelegramConnect.tsx')
  );
  
  // Copy the .env.local file
  fs.copyFileSync(
    path.join(mobileAppPath, '.env.local'),
    path.join(mobileRepoPath, '.env.local')
  );
  
  console.log('✅ Files copied\n');
  
  // Git operations
  console.log('📤 Committing and pushing changes...');
  
  execSync('git add -A', { cwd: mobileRepoPath });
  execSync(`git commit -m "Update Telegram integration for mobile app"`, { cwd: mobileRepoPath });
  execSync('git push', { cwd: mobileRepoPath });
  
  console.log('✅ Changes pushed to GitHub\n');
  
  // Trigger Netlify deploy
  console.log('🔄 Triggering Netlify deployment...');
  console.log('Deployment will complete in 2-3 minutes');
  console.log('\n📱 Mobile app will be updated at: https://portalerts.xyz');
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}