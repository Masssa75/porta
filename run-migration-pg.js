const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running SQL migration using pg client...\n');
  
  // Construct database URL
  const projectId = 'midojobnawatvxhmhmoh';
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (!dbPassword) {
    console.error('❌ Missing SUPABASE_DB_PASSWORD in .env file');
    console.log('\n📝 Alternative: Run manually in Supabase Dashboard');
    console.log('1. Go to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
    console.log('2. Copy contents from create-users-table.sql');
    console.log('3. Click "Run"');
    process.exit(1);
  }
  
  const dbUrl = process.env.DATABASE_URL || 
    `postgresql://postgres.${projectId}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
  
  console.log('📍 Connecting to database...');
  
  const client = new Client({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-users-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n📋 Executing migration...');
    console.log('Creating tables: users, referrals, projects');
    
    // Execute the migration
    await client.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'referrals', 'projects')
      ORDER BY table_name;
    `;
    
    const result = await client.query(verifyQuery);
    
    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name} (${row.column_count} columns)`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables may already exist. Checking...');
      
      try {
        const checkQuery = `
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'referrals', 'projects');
        `;
        
        const result = await client.query(checkQuery);
        
        if (result.rows.length > 0) {
          console.log('\n📊 Existing tables found:');
          result.rows.forEach(row => {
            console.log(`   ✅ ${row.table_name}`);
          });
          console.log('\n✅ Migration may have already been applied!');
        }
      } catch (checkError) {
        console.error('Could not verify table existence:', checkError.message);
      }
    }
    
    console.log('\n📝 Alternative: Run manually in Supabase Dashboard');
    console.log('URL: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql/new');
    
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch(console.error);