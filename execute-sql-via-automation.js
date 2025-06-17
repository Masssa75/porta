#!/usr/bin/env node

// Execute SQL migration using the automation server's MCP-style setup

const fs = require('fs');
const path = require('path');

console.log('🚀 Executing SQL migration via automation server...\n');

// Read the SQL file content
const sqlPath = path.join(__dirname, 'create-users-table.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Since we can't execute SQL directly through Supabase JS client,
// we'll use the automation server to run a command that will handle it

// Option 1: Try using psql if available
const psqlCommand = {
  action: 'execute',
  params: {
    command: `psql "${process.env.DATABASE_URL || ''}" -f create-users-table.sql`,
    cwd: '/Users/marcschwyn/desktop/projects/porta'
  }
};

// Option 2: Use Supabase CLI if installed
const supabaseCliCommand = {
  action: 'execute',
  params: {
    command: 'supabase db push --file create-users-table.sql',
    cwd: '/Users/marcschwyn/desktop/projects/porta'
  }
};

// Option 3: Create a Node script that uses pg library directly
const createPgScript = `
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  // Try to construct database URL from Supabase credentials
  const dbUrl = process.env.DATABASE_URL || 
    \`postgresql://postgres.\${process.env.SUPABASE_PROJECT_ID}:\${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres\`;
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    const sql = fs.readFileSync('create-users-table.sql', 'utf8');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
`;

// Save the pg script
fs.writeFileSync(path.join(__dirname, 'run-migration-pg.js'), createPgScript);

// Create command to install pg and run the script
const pgMigrationCommand = {
  action: 'execute',
  params: {
    command: 'npm install pg && node run-migration-pg.js',
    cwd: '/Users/marcschwyn/desktop/projects/porta'
  }
};

// Write command to automation-commands.json
const commandsFile = path.join(__dirname, 'automation-commands.json');
const commands = [pgMigrationCommand];

fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));

console.log('✅ Migration command prepared for automation server');
console.log('📋 The automation server will:');
console.log('   1. Install pg (PostgreSQL client library)');
console.log('   2. Run the migration using direct database connection');
console.log('\n⏳ Watch latest-result.json for execution status');

// Also provide manual alternative
console.log('\n📝 Alternative: Manual execution via Supabase Dashboard');
console.log('   1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
console.log('   2. Copy contents from: create-users-table.sql');
console.log('   3. Paste and click "Run"');

// Save a simplified version for easy copying
const simplifiedSql = `
-- Quick check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'referrals', 'projects');

-- If tables don't exist, run the migration from create-users-table.sql
`;

fs.writeFileSync(path.join(__dirname, 'check-tables.sql'), simplifiedSql);
console.log('\n✅ Created check-tables.sql for quick verification');