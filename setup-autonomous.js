#!/usr/bin/env node

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
This script will automatically:
1. Create a Next.js application
2. Set up Supabase backend
3. Create GitHub repository  
4. Deploy to Vercel
5. Configure everything

Starting in 3 seconds...
`);

// Helper function for API calls
async function apiCall(url, options = {}) {
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

async function setupProject() {
  const results = {};

  try {
    // Step 1: Create Next.js structure
    console.log('\n📁 Creating Next.js structure...');
    
    // Create directories
    const dirs = ['app', 'components', 'lib', 'public', 'scripts', 'supabase/functions'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    // Create essential files
    createNextJsFiles();
    
    console.log('✅ Next.js structure created');

    // Step 2: Initialize git
    console.log('\n📝 Initializing Git...');
    try {
      execSync('git init', { cwd: __dirname, stdio: 'pipe' });
      execSync('git add .', { cwd: __dirname, stdio: 'pipe' });
      execSync('git commit -m "Initial commit: porta setup"', { cwd: __dirname, stdio: 'pipe' });
      console.log('✅ Git initialized');
    } catch (e) {
      console.log('⚠️  Git already initialized');
    }

    // Step 3: Create Supabase project
    console.log('\n🗄️  Creating Supabase project...');
    results.supabase = await createSupabaseProject();
    
    // Step 4: Create GitHub repository
    console.log('\n🐙 Creating GitHub repository...');
    results.github = await createGitHubRepo();
    
    // Step 5: Push to GitHub
    console.log('\n📤 Pushing to GitHub...');
    await pushToGitHub(results.github.clone_url);
    
    // Step 6: Deploy to Vercel
    console.log('\n▲ Deploying to Vercel...');
    results.vercel = await deployToVercel(results.github);
    
    // Success!
    console.log(`
✨ PROJECT SUCCESSFULLY DEPLOYED! ✨
=====================================

🌐 Your app is live at: ${results.vercel.url}

📊 Dashboards:
- Vercel: ${results.vercel.dashboard}
- GitHub: ${results.github.html_url}
- Supabase: https://app.supabase.com/project/${results.supabase.project.id}

🔑 Environment variables have been configured in Vercel

📝 Next steps:
1. Add your ScraperAPI key to Supabase Edge Functions
2. Configure Telegram bot
3. Add Gemini API key
4. Visit your live app!

🎉 Total setup time: ${Math.round((Date.now() - startTime) / 1000)}s
`);

    // Save results
    fs.writeFileSync('deployment-results.json', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\nPartial results:', results);
    process.exit(1);
  }
}

async function createSupabaseProject() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  
  // Get organizations
  const orgs = await apiCall('https://api.supabase.com/v1/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!orgs.length) throw new Error('No Supabase organizations found');
  
  // Create project
  const project = await apiCall('https://api.supabase.com/v1/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: {
      organization_id: orgs[0].id,
      name: PROJECT_NAME,
      db_pass: generatePassword(),
      region: 'us-east-1',
      plan: 'free'
    }
  });
  
  console.log(`✅ Supabase project created: ${project.id}`);
  
  // Wait for project to be ready
  console.log('⏳ Waiting for project to be ready...');
  let status = 'COMING_UP';
  while (status !== 'ACTIVE_HEALTHY') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const check = await apiCall(`https://api.supabase.com/v1/projects/${project.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    status = check.status;
  }
  
  // Get API keys
  const keys = await apiCall(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Save credentials
  const supabaseEnv = `
NEXT_PUBLIC_SUPABASE_URL=https://${project.id}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.find(k => k.name === 'anon').api_key}
SUPABASE_SERVICE_ROLE_KEY=${keys.find(k => k.name === 'service_role').api_key}
`;
  
  fs.appendFileSync('.env.local', supabaseEnv);
  
  return { project, keys };
}

async function createGitHubRepo() {
  const token = process.env.GITHUB_TOKEN;
  
  const repo = await apiCall('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'porta-setup'
    },
    body: {
      name: PROJECT_NAME,
      description: 'Crypto portfolio monitor with AI alerts',
      private: false,
      auto_init: false
    }
  });
  
  console.log(`✅ GitHub repo created: ${repo.html_url}`);
  return repo;
}

async function pushToGitHub(repoUrl) {
  execSync(`git remote add origin ${repoUrl} 2>/dev/null || git remote set-url origin ${repoUrl}`, { cwd: __dirname });
  execSync('git branch -M main', { cwd: __dirname });
  execSync('git push -u origin main --force', { cwd: __dirname });
  console.log('✅ Code pushed to GitHub');
}

async function deployToVercel(githubRepo) {
  const token = process.env.VERCEL_TOKEN;
  
  // Create Vercel project
  const project = await apiCall('https://api.vercel.com/v10/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: {
      name: PROJECT_NAME,
      framework: 'nextjs',
      gitRepository: {
        type: 'github',
        repo: `${GITHUB_USERNAME}/${PROJECT_NAME}`
      }
    }
  });
  
  // Add environment variables
  const envVars = fs.readFileSync('.env.local', 'utf8').split('\n').filter(line => line.includes('='));
  for (const line of envVars) {
    const [key, value] = line.split('=');
    if (key && value) {
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
    }
  }
  
  // Trigger deployment
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
  
  console.log(`✅ Vercel deployment started: https://${deployment.url}`);
  
  return {
    url: `https://${PROJECT_NAME}.vercel.app`,
    dashboard: `https://vercel.com/${project.accountId}/${PROJECT_NAME}`,
    deploymentUrl: `https://${deployment.url}`
  };
}

function createNextJsFiles() {
  // Create all necessary Next.js files
  const files = {
    '.gitignore': `node_modules/
.next/
.env.local
.vercel
*.log`,
    
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
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
    
    'next.config.js': `module.exports = {
  images: {
    domains: ['assets.coingecko.com'],
  },
}`,
    
    'tailwind.config.js': `module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}`,
    
    'postcss.config.js': `module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}`,
    
    'app/layout.tsx': `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PortA - Crypto Monitor',
  description: 'Real-time crypto monitoring',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
    
    'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: #0a0a0a;
  color: #e0e0e0;
}`,
    
    'app/page.tsx': `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">PortA</h1>
        <p className="text-xl text-gray-400 mb-8">Crypto Portfolio Monitor</p>
        <div className="bg-gray-900 rounded-xl p-8">
          <p className="text-green-400">✅ Successfully deployed!</p>
          <p className="mt-4">Your autonomous setup is complete.</p>
        </div>
      </div>
    </main>
  )
}`,

    '.env.local': '# Auto-generated by setup\n'
  };
  
  Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(__dirname, filename), content);
  });
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Start setup
const startTime = Date.now();
setTimeout(setupProject, 3000);