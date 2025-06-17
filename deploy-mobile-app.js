const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployMobileApp() {
  console.log('🚀 Deploying PortAlerts Mobile App to GitHub...\n');

  const mobileDir = path.join(__dirname, 'mobile-app');
  const tempDir = path.join(__dirname, '..', 'portalerts-mobile-temp');

  try {
    // Step 1: Copy mobile app to temp directory
    console.log('1️⃣ Copying mobile app files...');
    execSync(`cp -r ${mobileDir} ${tempDir}`, { stdio: 'inherit' });

    // Step 2: Initialize git in temp directory
    console.log('\n2️⃣ Initializing git repository...');
    process.chdir(tempDir);
    execSync('git init', { stdio: 'inherit' });

    // Step 3: Create README for the mobile app
    console.log('\n3️⃣ Creating README...');
    const readme = `# PortAlerts Mobile App

🚀 Mobile-first crypto alerts platform

## Features
- 🔍 Real-time crypto search
- 📱 Mobile-optimized UI
- 🤖 Telegram notifications
- 👥 Referral system
- 💎 Token-gated premium features

## Setup
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment
This app is designed to be deployed on Netlify at portalerts.xyz

## Environment Variables
\`\`\`
NEXT_PUBLIC_API_URL=https://portax.netlify.app
NEXT_PUBLIC_API_KEY=your_api_key
NEXT_PUBLIC_TELEGRAM_BOT=porta_alerts_bot
\`\`\`

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Wagmi (Web3)
`;
    fs.writeFileSync('README.md', readme);

    // Step 4: Create Netlify config
    console.log('\n4️⃣ Creating Netlify configuration...');
    const netlifyToml = `[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer-when-downgrade"
`;
    fs.writeFileSync('netlify.toml', netlifyToml);

    // Step 5: Add all files and commit
    console.log('\n5️⃣ Committing files...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Initial commit: PortAlerts mobile app"', { stdio: 'inherit' });

    // Step 6: Create GitHub repo
    console.log('\n6️⃣ Creating GitHub repository...');
    const createRepoCommand = `
      curl -X POST \
        -H "Authorization: token $(cat ~/.github_token)" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d '{"name":"portalerts-mobile","description":"Mobile app for PortAlerts crypto notifications","private":false}'
    `;
    
    try {
      execSync(createRepoCommand, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Could not create repo automatically. Please create manually: portalerts-mobile');
    }

    // Step 7: Add remote and push
    console.log('\n7️⃣ Pushing to GitHub...');
    execSync('git remote add origin https://github.com/Masssa75/portalerts-mobile.git', { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });
    
    try {
      execSync('git push -u origin main', { stdio: 'inherit' });
      console.log('\n✅ Mobile app deployed successfully!');
      console.log('📱 Repository: https://github.com/Masssa75/portalerts-mobile');
      console.log('\n🔗 Next steps:');
      console.log('1. Go to Netlify and import this repo');
      console.log('2. Set custom domain to portalerts.xyz');
      console.log('3. Add environment variables in Netlify settings');
    } catch (error) {
      console.log('\n⚠️  Push failed. Manual steps:');
      console.log('1. Create repo at: https://github.com/new');
      console.log('2. Name it: portalerts-mobile');
      console.log('3. Run: git remote add origin https://github.com/Masssa75/portalerts-mobile.git');
      console.log('4. Run: git push -u origin main');
    }

    // Cleanup
    process.chdir(__dirname);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.chdir(__dirname);
  }
}

// Run deployment
deployMobileApp();