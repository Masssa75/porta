const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLS() {
  try {
    console.log('Setting up Row Level Security policies...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(__dirname, 'supabase-setup.sql'), 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      // If exec_sql doesn't exist, try direct approach
      console.log('Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        // Use the Supabase Management API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement + ';' })
        });

        if (!response.ok) {
          const text = await response.text();
          console.error(`Failed to execute: ${text}`);
        }
      }
    }

    console.log('RLS setup completed successfully!');
  } catch (error) {
    console.error('Error setting up RLS:', error);
    
    console.log('\nAlternative: You can manually run the SQL by:');
    console.log('1. Going to: https://app.supabase.com/project/midojobnawatvxhmhmoh/sql');
    console.log('2. Copying the contents of supabase-setup.sql');
    console.log('3. Pasting and running it in the SQL editor');
  }
}

// Alternative approach using direct HTTP API
async function setupRLSViaAPI() {
  try {
    console.log('Attempting to set up RLS via Supabase Management API...');
    
    const projectRef = 'midojobnawatvxhmhmoh';
    const statements = [
      // First, check if RLS is already enabled
      `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('projects', 'tweet_analyses', 'notifications', 'monitoring_logs');`,
      
      // Enable RLS
      `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE tweet_analyses ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;`,
      
      // Create policies for projects
      `CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON projects FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON projects FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable update for all users" ON projects FOR UPDATE USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable delete for all users" ON projects FOR DELETE USING (true);`,
      
      // Create policies for other tables
      `CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON tweet_analyses FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON tweet_analyses FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON notifications FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON notifications FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON monitoring_logs FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON monitoring_logs FOR INSERT WITH CHECK (true);`
    ];

    for (const sql of statements) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            query: sql
          })
        });

        if (response.ok) {
          console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
        } else {
          console.log(`✗ Failed: ${sql.substring(0, 50)}...`);
        }
      } catch (err) {
        console.error(`Error executing SQL:`, err.message);
      }
    }

    console.log('\nRLS setup process completed!');
    console.log('Please check your Supabase dashboard to verify the policies were created.');
    
  } catch (error) {
    console.error('Error in API approach:', error);
  }
}

// Try the standard approach first
setupRLS().catch(() => {
  console.log('\nTrying alternative API approach...\n');
  setupRLSViaAPI();
});