#!/usr/bin/env node

// Simple MCP Server for Project Automation
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const PORT = process.env.MCP_PORT || 3456;

// Create HTTP server that Claude can call
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse request body
  let body = '';
  req.on('data', chunk => body += chunk);
  
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const { action, params } = data;

      console.log(`\n🤖 MCP Server: Received action '${action}'`);

      let result;
      switch (action) {
        case 'create_project':
          result = await createProject(params);
          break;
          
        case 'run_command':
          result = await runCommand(params);
          break;
          
        case 'check_status':
          result = await checkStatus();
          break;
          
        case 'deploy_project':
          result = await deployProject(params);
          break;
          
        default:
          result = { error: `Unknown action: ${action}` };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      
    } catch (error) {
      console.error('❌ MCP Server Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

// Action handlers
async function createProject({ projectName, template }) {
  console.log(`📁 Creating project: ${projectName}`);
  
  const projectPath = path.join(process.cwd(), '..', projectName);
  
  // Create project directory
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }
  
  // Copy template files
  // ... implementation ...
  
  return {
    success: true,
    projectPath,
    message: `Project ${projectName} created successfully`
  };
}

async function runCommand({ command, cwd }) {
  console.log(`🖥️  Running command: ${command}`);
  
  try {
    const output = execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    return {
      success: true,
      output,
      command
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString(),
      command
    };
  }
}

async function checkStatus() {
  return {
    status: 'running',
    port: PORT,
    tokens: {
      github: !!process.env.GITHUB_TOKEN,
      vercel: !!process.env.VERCEL_TOKEN,
      supabase: !!process.env.SUPABASE_ACCESS_TOKEN
    },
    timestamp: new Date().toISOString()
  };
}

async function deployProject({ projectPath, projectName }) {
  console.log(`🚀 Deploying project: ${projectName}`);
  
  // Run the autonomous setup script
  const setupScript = path.join(projectPath, 'setup-autonomous-v2.js');
  
  if (!fs.existsSync(setupScript)) {
    return {
      success: false,
      error: 'Setup script not found'
    };
  }
  
  try {
    const output = execSync(`node ${setupScript}`, {
      cwd: projectPath,
      encoding: 'utf8',
      env: { ...process.env, PROJECT_NAME: projectName }
    });
    
    // Parse deployment results
    const resultsPath = path.join(projectPath, 'deployment-results.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      return {
        success: true,
        ...results
      };
    }
    
    return {
      success: true,
      output
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout?.toString()
    };
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
🤖 MCP Automation Server Running!
==================================

📡 Server URL: http://localhost:${PORT}

Available Actions:
- create_project: Create a new project
- run_command: Execute shell commands
- check_status: Check server status
- deploy_project: Deploy a project automatically

Claude can now call this server directly to:
✅ Create projects
✅ Run commands
✅ Deploy to cloud
✅ Manage infrastructure

Example request:
POST http://localhost:${PORT}
{
  "action": "run_command",
  "params": {
    "command": "node setup-autonomous-v2.js",
    "cwd": "/path/to/project"
  }
}

Press Ctrl+C to stop the server.
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 MCP Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});