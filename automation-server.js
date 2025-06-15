#!/usr/bin/env node

// Automation Server for Claude Code
// This creates a bridge between Claude Code and your system

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment
require('dotenv').config();

// Configuration
const PROJECTS_BASE_DIR = '/Users/marcschwyn/Desktop/projects';
const COMMANDS_FILE = path.join(__dirname, 'automation-commands.json');
const LOG_FILE = path.join(__dirname, 'automation.log');

// Initialize readline for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Logging function
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Command queue system
class CommandQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(command) {
    this.queue.push(command);
    log(`Added to queue: ${command.action}`);
    this.process();
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const command = this.queue.shift();
    
    try {
      log(`Processing: ${command.action}`);
      const result = await this.execute(command);
      this.saveResult(command, result);
    } catch (error) {
      log(`Error: ${error.message}`, 'error');
      this.saveResult(command, { error: error.message });
    }
    
    this.processing = false;
    this.process(); // Process next command
  }

  async execute(command) {
    switch (command.action) {
      case 'create_project':
        return await this.createProject(command.params);
      
      case 'run_setup':
        return await this.runSetup(command.params);
      
      case 'execute':
        return await this.executeCommand(command.params);
      
      case 'git_operations':
        return await this.gitOperations(command.params);
        
      case 'deploy':
        return await this.deploy(command.params);
        
      default:
        throw new Error(`Unknown action: ${command.action}`);
    }
  }

  async createProject(params) {
    const { projectName, template = 'porta' } = params;
    const projectPath = path.join(PROJECTS_BASE_DIR, projectName);
    
    log(`Creating project: ${projectName}`);
    
    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Copy template files from porta
    const templatePath = path.join(PROJECTS_BASE_DIR, template);
    if (fs.existsSync(templatePath)) {
      // Copy essential files
      const filesToCopy = [
        'package.json',
        'setup-autonomous-v2.js',
        '.env',
        '.gitignore',
        'tsconfig.json',
        'next.config.js',
        'tailwind.config.js',
        'postcss.config.js'
      ];
      
      filesToCopy.forEach(file => {
        const src = path.join(templatePath, file);
        const dest = path.join(projectPath, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      });
      
      // Copy directories
      const dirsToCopy = ['app', 'components', 'lib', 'public'];
      dirsToCopy.forEach(dir => {
        const src = path.join(templatePath, dir);
        const dest = path.join(projectPath, dir);
        if (fs.existsSync(src)) {
          this.copyDirectory(src, dest);
        }
      });
    }
    
    // Update project name in package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.name = projectName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    // Update .env with project name
    const envPath = path.join(projectPath, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/PROJECT_NAME=.*/g, `PROJECT_NAME=${projectName}`);
      fs.writeFileSync(envPath, envContent);
    }
    
    return {
      success: true,
      projectPath,
      message: `Project ${projectName} created at ${projectPath}`
    };
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async runSetup(params) {
    const { projectName } = params;
    const projectPath = path.join(PROJECTS_BASE_DIR, projectName);
    const setupScript = path.join(projectPath, 'setup-autonomous-v2.js');
    
    if (!fs.existsSync(setupScript)) {
      throw new Error('Setup script not found');
    }
    
    log(`Running setup for: ${projectName}`);
    
    try {
      // Install dependencies first
      execSync('npm install', {
        cwd: projectPath,
        stdio: 'inherit'
      });
      
      // Run setup script
      const output = execSync(`node setup-autonomous-v2.js`, {
        cwd: projectPath,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      
      // Read deployment results
      const resultsPath = path.join(projectPath, 'deployment-results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        return {
          success: true,
          deploymentUrl: results.vercel?.url,
          results
        };
      }
      
      return {
        success: true,
        output
      };
      
    } catch (error) {
      const partialResultsPath = path.join(projectPath, 'deployment-results-partial.json');
      if (fs.existsSync(partialResultsPath)) {
        const partialResults = JSON.parse(fs.readFileSync(partialResultsPath, 'utf8'));
        return {
          success: false,
          error: error.message,
          partialResults
        };
      }
      throw error;
    }
  }

  async executeCommand(params) {
    const { command, cwd = process.cwd() } = params;
    
    log(`Executing: ${command} in ${cwd}`);
    
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    return {
      success: true,
      output,
      command
    };
  }

  async gitOperations(params) {
    const { operation, projectPath, message } = params;
    
    switch (operation) {
      case 'init':
        execSync('git init', { cwd: projectPath });
        break;
      case 'add':
        execSync('git add .', { cwd: projectPath });
        break;
      case 'commit':
        execSync(`git commit -m "${message || 'Automated commit'}"`, { cwd: projectPath });
        break;
      case 'push':
        execSync('git push -u origin main', { cwd: projectPath });
        break;
    }
    
    return {
      success: true,
      operation,
      projectPath
    };
  }

  async deploy(params) {
    const { projectName, platform = 'all' } = params;
    
    log(`Deploying ${projectName} to ${platform}`);
    
    // Run full deployment
    return await this.runSetup({ projectName });
  }

  saveResult(command, result) {
    const timestamp = new Date().toISOString();
    const resultData = {
      timestamp,
      command,
      result
    };
    
    // Save to results file
    const resultsFile = path.join(__dirname, 'automation-results.json');
    let results = [];
    
    if (fs.existsSync(resultsFile)) {
      results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    }
    
    results.push(resultData);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Also save latest result for Claude to read
    fs.writeFileSync(
      path.join(__dirname, 'latest-result.json'),
      JSON.stringify(resultData, null, 2)
    );
  }
}

// Initialize command queue
const queue = new CommandQueue();

// Watch for commands file
function watchForCommands() {
  if (fs.existsSync(COMMANDS_FILE)) {
    const commands = JSON.parse(fs.readFileSync(COMMANDS_FILE, 'utf8'));
    
    if (commands.length > 0) {
      const command = commands.shift();
      queue.add(command);
      
      // Update commands file
      fs.writeFileSync(COMMANDS_FILE, JSON.stringify(commands, null, 2));
    }
  }
}

// Start server
console.log(`
🤖 Automation Server for Claude Code
====================================

This server allows Claude Code to automate project creation and deployment.

How it works:
1. Claude writes commands to: automation-commands.json
2. This server executes them automatically
3. Results are saved to: latest-result.json

Available commands:
- create_project: Create new project from template
- run_setup: Run autonomous setup script
- execute: Run any shell command
- git_operations: Git init/add/commit/push
- deploy: Full deployment pipeline

Watching for commands...
Press Ctrl+C to stop.
`);

// Create initial commands file if it doesn't exist
if (!fs.existsSync(COMMANDS_FILE)) {
  fs.writeFileSync(COMMANDS_FILE, '[]');
}

// Watch for commands every 2 seconds
setInterval(watchForCommands, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Automation server shutting down...');
  process.exit(0);
});