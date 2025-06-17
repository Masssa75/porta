#!/usr/bin/env node

// Pass API key as command line argument
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node setup-cronjob-with-key.js YOUR_API_KEY');
  process.exit(1);
}

// Run the setup with the provided key
const { spawn } = require('child_process');
const setup = spawn('node', ['setup-cronjob.js'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send the API key to stdin
setup.stdin.write(apiKey + '\n');
setup.stdin.end();