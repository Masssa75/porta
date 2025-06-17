#!/usr/bin/env node

// Script to execute the create-users-table.sql migration via the automation server

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing to execute users table migration via automation server...\n');

// Create the command for the automation server
const command = {
  action: 'execute',
  params: {
    command: 'node run-sql-migration.js create-users-table.sql',
    cwd: '/Users/marcschwyn/desktop/projects/porta'
  }
};

// Write command to automation-commands.json
const commandsFile = path.join(__dirname, 'automation-commands.json');
const commands = [command];

fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));

console.log('✅ Command written to automation-commands.json');
console.log('📋 Command details:', JSON.stringify(command, null, 2));
console.log('\nThe automation server will now execute the SQL migration automatically.');
console.log('Check latest-result.json for the execution result.');