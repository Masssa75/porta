#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// SQL migration automation using Supabase CLI
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-sql-migration.js <migration-file.sql>');
  process.exit(1);
}

console.log(`🔧 Running SQL migration: ${migrationFile}\n`);

try {
  // Check if file exists
  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  // Read SQL content
  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  console.log('SQL to execute:');
  console.log(sqlContent);
  console.log('\n');

  // Use Supabase CLI to run migration
  const supabasePath = path.join(__dirname, 'supabase-cli', 'supabase');
  const command = `${supabasePath} db push --project-ref midojobnawatvxhmhmoh`;
  
  console.log('Running migration via Supabase CLI...');
  const output = execSync(command, {
    cwd: __dirname,
    encoding: 'utf8'
  });
  
  console.log('✅ Migration completed!');
  console.log(output);

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\nAlternative: Use psql or Supabase dashboard');
  process.exit(1);
}