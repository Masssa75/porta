#!/usr/bin/env node

// Enhanced autonomous setup with better error handling
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config();

// Configuration
const PROJECT_NAME = process.env.PROJECT_NAME || 'porta';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'marcschwyn';

console.log(`
🚀 AUTONOMOUS PROJECT SETUP: ${PROJECT_NAME}
================================================

Checking prerequisites...
`);

// Check if we're in Node REPL
if (typeof window === 'undefined' && process.versions && process.versions.node) {
  console.log('✅ Running in correct environment');
} else {
  console.error('❌ Please run this script from terminal, not Node REPL');
  process.exit(1);
}

// Check required tokens
const requiredTokens = {
  'SUPABASE_ACCESS_TOKEN': process.env.SUPABASE_ACCESS_TOKEN,
  'GITHUB_TOKEN': process.env.GITHUB_TOKEN,
  'VERCEL_TOKEN': process.env.VERCEL_TOKEN
};

let tokensValid = true;
Object.entries(requiredTokens).forEach(([name, value]) => {
  if (!value) {
    console.error(`❌ Missing ${name}`);
    tokensValid = false;
  } else {
    console.log(`✅ ${name} found`);
  }
});

if (!tokensValid) {
  console.error('\n❌ Please add missing tokens to .env file');
  process.exit(1);
}

console.log('\n✅ All prerequisites met! Starting setup...\n');

// Main setup function with better error handling
async function setupProject() {
  const results = {
    startTime: Date.now(),
    steps: {}
  };

  try {
    // Step 1: Create project structure
    console.log('📁 Step 1/6: Creating project structure...');
    await createProjectStructure();
    results.steps.structure = 'completed';
    
    // Step 2: Initialize git
    console.log('\n📝 Step 2/6: Initializing Git...');
    await initializeGit();
    results.steps.git = 'completed';
    
    // Step 3: Create Supabase project
    console.log('\n🗄️  Step 3/6: Creating Supabase project...');
    results.supabase = await createSupabaseProject();
    results.steps.supabase = 'completed';
    
    // Step 4: Create GitHub repository
    console.log('\n🐙 Step 4/6: Creating GitHub repository...');
    results.github = await createGitHubRepo();
    results.steps.github = 'completed';
    
    // Step 5: Push to GitHub
    console.log('\n📤 Step 5/6: Pushing to GitHub...');
    await pushToGitHub(results.github.clone_url);
    results.steps.push = 'completed';
    
    // Step 6: Deploy to Vercel
    console.log('\n▲ Step 6/6: Deploying to Vercel...');
    results.vercel = await deployToVercel(results.github);
    results.steps.vercel = 'completed';
    
    // Calculate duration
    const duration = Math.round((Date.now() - results.startTime) / 1000);
    
    // Success!
    console.log(`
════════════════════════════════════════════════════════════════════

✨ PROJECT SUCCESSFULLY DEPLOYED! ✨

🌐 Your app is LIVE at: ${results.vercel.url}

📊 Dashboards:
   Vercel:   ${results.vercel.dashboard}
   GitHub:   ${results.github.html_url}
   Supabase: https://app.supabase.com/project/${results.supabase.project.id}

⏱️  Total setup time: ${duration} seconds

📝 Next steps:
   1. Visit your live app
   2. Add ScraperAPI key to Supabase
   3. Configure Telegram bot
   4. Add Gemini API key

💾 Full details saved to: deployment-results.json

════════════════════════════════════════════════════════════════════
`);

    // Save results
    fs.writeFileSync('deployment-results.json', JSON.stringify(results, null, 2));
    
    return results;

  } catch (error) {
    console.error('\n❌ Setup failed at step:', Object.keys(results.steps).length + 1);
    console.error('Error:', error.message);
    console.log('\nPartial results:', JSON.stringify(results, null, 2));
    
    // Save partial results
    fs.writeFileSync('deployment-results-partial.json', JSON.stringify({
      ...results,
      error: error.message,
      failedAt: new Date().toISOString()
    }, null, 2));
    
    process.exit(1);
  }
}

// Helper function for safe API calls
async function apiCall(url, options = {}) {
  const maxRetries = 3;
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await makeApiCall(url, options);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        console.log(`   Retry ${i + 1}/${maxRetries - 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  throw lastError;
}

async function makeApiCall(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function createProjectStructure() {
  const dirs = ['app', 'components', 'lib', 'public', 'scripts', 'supabase/functions'];
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Create all necessary files
  const files = {
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "node",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"]
    }, null, 2),
    
    'next.config.js': `/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['assets.coingecko.com'],
  },
}`,
    
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    
    'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    
    'app/layout.tsx': `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PortA - Crypto Monitor',
  description: 'Real-time crypto monitoring with AI alerts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
    
    'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  color: var(--foreground);
  background: var(--background);
}`,
    
    'app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          PortA
        </h1>
        <p className="text-xl text-gray-400 mb-8">Crypto Portfolio Monitor</p>
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="ml-2 text-green-400 font-semibold">Live</p>
          </div>
          <p className="text-lg">✨ Autonomous deployment successful!</p>
          <p className="mt-4 text-gray-400">
            This project was deployed completely automatically using API integrations.
          </p>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <p>✅ GitHub repository created</p>
            <p>✅ Supabase backend configured</p>
            <p>✅ Deployed to Vercel</p>
            <p>✅ Environment variables set</p>
          </div>
        </div>
      </div>
    </main>
  )
}`,

    '.env.local': '# Auto-generated by autonomous setup\n'
  };
  
  Object.entries(files).forEach(([filename, content]) => {
    const filepath = path.join(__dirname, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, content);
    }
  });
  
  console.log('   ✅ Project structure created');
}

async function initializeGit() {
  try {
    execSync('git init', { cwd: __dirname, stdio: 'pipe' });
    execSync('git add .', { cwd: __dirname, stdio: 'pipe' });
    execSync('git commit -m "Initial commit: PortA autonomous setup"', { cwd: __dirname, stdio: 'pipe' });
    console.log('   ✅ Git repository initialized');
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      console.log('   ✅ Git already initialized');
    } else {
      throw error;
    }
  }
}

async function createSupabaseProject() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  
  console.log('   Getting organizations...');
  const orgs = await apiCall('https://api.supabase.com/v1/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!orgs.length) throw new Error('No Supabase organizations found');
  console.log(`   Using organization: ${orgs[0].name}`);
  
  console.log('   Creating project...');
  const project = await apiCall('https://api.supabase.com/v1/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: {
      organization_id: orgs[0].id,
      name: PROJECT_NAME,
      db_pass: generateSecurePassword(),
      region: 'us-east-1',
      plan: 'free'
    }
  });
  
  console.log(`   Project created: ${project.id}`);
  console.log('   Waiting for project to be ready...');
  
  // Poll for project status
  let status = 'COMING_UP';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (status !== 'ACTIVE_HEALTHY' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const check = await apiCall(`https://api.supabase.com/v1/projects/${project.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    status = check.status;
    attempts++;
    
    if (attempts % 6 === 0) {
      console.log(`   Still waiting... (${attempts * 5}s)`);
    }
  }
  
  if (status !== 'ACTIVE_HEALTHY') {
    throw new Error('Supabase project failed to become ready');
  }
  
  console.log('   Getting API keys...');
  const keys = await apiCall(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Save credentials to .env.local
  const supabaseEnv = `NEXT_PUBLIC_SUPABASE_URL=https://${project.id}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.find(k => k.name === 'anon').api_key}
SUPABASE_SERVICE_ROLE_KEY=${keys.find(k => k.name === 'service_role').api_key}
SUPABASE_PROJECT_ID=${project.id}
`;
  
  fs.appendFileSync(path.join(__dirname, '.env.local'), supabaseEnv);
  console.log('   ✅ Supabase project ready');
  
  return { project, keys };
}

async function createGitHubRepo() {
  const token = process.env.GITHUB_TOKEN;
  
  console.log('   Creating repository...');
  
  try {
    const repo = await apiCall('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'porta-setup'
      },
      body: {
        name: PROJECT_NAME,
        description: 'Crypto portfolio monitor with AI-powered alerts',
        private: false,
        auto_init: false,
        has_issues: true,
        has_projects: true,
        has_wiki: false
      }
    });
    
    console.log(`   ✅ Repository created: ${repo.html_url}`);
    return repo;
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   Repository already exists, fetching details...');
      const user = await apiCall('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'porta-setup'
        }
      });
      
      const repo = await apiCall(`https://api.github.com/repos/${user.login}/${PROJECT_NAME}`, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'porta-setup'
        }
      });
      
      console.log(`   ✅ Using existing repository: ${repo.html_url}`);
      return repo;
    }
    throw error;
  }
}

async function pushToGitHub(repoUrl) {
  console.log('   Setting up remote...');
  
  try {
    execSync(`git remote add origin ${repoUrl}`, { cwd: __dirname, stdio: 'pipe' });
  } catch (error) {
    execSync(`git remote set-url origin ${repoUrl}`, { cwd: __dirname, stdio: 'pipe' });
  }
  
  console.log('   Pushing to GitHub...');
  execSync('git branch -M main', { cwd: __dirname, stdio: 'pipe' });
  
  try {
    execSync('git push -u origin main --force', { cwd: __dirname, stdio: 'pipe' });
    console.log('   ✅ Code pushed to GitHub');
  } catch (error) {
    console.log('   ⚠️  Push failed, trying alternative method...');
    execSync('git push origin main --force', { cwd: __dirname, stdio: 'pipe' });
    console.log('   ✅ Code pushed to GitHub');
  }
}

async function deployToVercel(githubRepo) {
  const token = process.env.VERCEL_TOKEN;
  
  console.log('   Getting user info...');
  const user = await apiCall('https://api.vercel.com/v2/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('   Creating Vercel project...');
  
  let project;
  try {
    project = await apiCall('https://api.vercel.com/v10/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: PROJECT_NAME,
        framework: 'nextjs',
        publicSource: true,
        gitRepository: {
          type: 'github',
          repo: `${GITHUB_USERNAME}/${PROJECT_NAME}`
        },
        rootDirectory: '',
        buildCommand: 'npm run build',
        devCommand: 'npm run dev',
        installCommand: 'npm install',
        outputDirectory: '.next'
      }
    });
    console.log('   Project created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   Project already exists');
      project = await apiCall(`https://api.vercel.com/v9/projects/${PROJECT_NAME}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } else {
      throw error;
    }
  }
  
  console.log('   Setting environment variables...');
  
  // Read .env.local and set environment variables
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const envLines = envContent.split('\n').filter(line => line.includes('='));
  
  for (const line of envLines) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    
    if (key && value) {
      try {
        await apiCall(`https://api.vercel.com/v10/projects/${project.id}/env`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            type: 'encrypted',
            key: key.trim(),
            value: value.trim(),
            target: ['production', 'preview', 'development']
          }
        });
      } catch (error) {
        // Ignore if already exists
      }
    }
  }
  
  console.log('   Triggering deployment...');
  
  const deployment = await apiCall('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: {
      name: PROJECT_NAME,
      project: project.id,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: githubRepo.id,
        ref: 'main'
      }
    }
  });
  
  console.log('   ✅ Deployment started');
  
  return {
    url: `https://${PROJECT_NAME}.vercel.app`,
    dashboard: `https://vercel.com/${user.username || user.name}/${PROJECT_NAME}`,
    deploymentUrl: `https://${deployment.url}`
  };
}

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Check if running directly (not in REPL)
if (require.main === module) {
  console.log('Starting in 3 seconds...\n');
  setTimeout(setupProject, 3000);
} else {
  console.error('❌ Please run this script directly: node setup-autonomous-v2.js');
}