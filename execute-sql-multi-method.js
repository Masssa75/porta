
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Finding best method to execute SQL migration...');

const methods = [
  {
    name: 'Supabase CLI',
    check: 'supabase --version',
    execute: 'supabase db push --file create-users-table.sql'
  },
  {
    name: 'PostgreSQL psql',
    check: 'psql --version',
    execute: () => {
      const dbUrl = process.env.DATABASE_URL || 
        `postgresql://postgres.midojobnawatvxhmhmoh:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
      return `psql "${dbUrl}" -f create-users-table.sql`;
    }
  },
  {
    name: 'Node.js pg client',
    check: () => {
      try {
        require.resolve('pg');
        return true;
      } catch {
        return false;
      }
    },
    execute: 'node run-migration-pg.js'
  }
];

// Try each method
for (const method of methods) {
  console.log(`\n🔧 Trying ${method.name}...`);
  
  try {
    // Check if method is available
    if (typeof method.check === 'function') {
      if (!method.check()) {
        console.log(`❌ ${method.name} not available`);
        continue;
      }
    } else {
      execSync(method.check, { stdio: 'ignore' });
    }
    
    console.log(`✅ ${method.name} is available!`);
    
    // Execute the migration
    const command = typeof method.execute === 'function' ? method.execute() : method.execute;
    console.log(`📍 Running: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: __dirname 
    });
    
    console.log('✅ Migration executed successfully!');
    console.log(output);
    process.exit(0);
    
  } catch (error) {
    console.log(`❌ ${method.name} failed: ${error.message}`);
  }
}

console.log('\n❌ No SQL execution method available');
console.log('\n📋 Manual steps:');
console.log('1. Install Supabase CLI: npm install -g supabase');
console.log('2. Or install pg client: npm install pg');
console.log('3. Or run manually in Supabase Dashboard');
