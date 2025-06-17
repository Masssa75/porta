const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQLMigration() {
  console.log('🚀 Executing SQL migration via PostgreSQL client...\n');
  
  // Check if pg is installed
  try {
    require.resolve('pg');
  } catch (e) {
    console.log('📦 Installing pg client...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
  }
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, 'create-users-table.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Construct database URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD;
  const dbUrl = process.env.DATABASE_URL || 
    `postgresql://postgres.midojobnawatvxhmhmoh:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
  
  if (!dbPassword && !process.env.DATABASE_URL) {
    console.log('❌ Missing database credentials');
    console.log('Please set SUPABASE_DB_PASSWORD or DATABASE_URL in .env.local');
    return;
  }
  
  const client = new Client({
    connectionString: dbUrl
  });
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    console.log('📝 Executing migration...');
    await client.query(sqlContent);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'referrals', 'projects')
    `);
    
    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\nFallback: Run in Supabase Dashboard');
    console.log('https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
  } finally {
    await client.end();
  }
}

executeSQLMigration();