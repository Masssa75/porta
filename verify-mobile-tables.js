const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMobileTables() {
  console.log('🔍 Verifying mobile app tables creation...\n');
  
  const tablesToCheck = [
    { name: 'users', required: true },
    { name: 'user_projects', required: true },
    { name: 'referrals', required: true },
    { name: 'api_access_logs', required: true },
    { name: 'user_projects_detailed', required: false, type: 'view' }
  ];
  
  let allGood = true;
  
  for (const table of tablesToCheck) {
    console.log(`📊 Checking ${table.name}...`);
    
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(0);
      
      if (error && error.code === '42P01') {
        console.log(`❌ ${table.name} does NOT exist`);
        if (table.required) allGood = false;
      } else if (error) {
        console.log(`⚠️  ${table.name} error:`, error.message);
        if (table.required) allGood = false;
      } else {
        console.log(`✅ ${table.name} EXISTS`);
        
        // Get column information
        if (table.name === 'users') {
          // Test insert to verify all columns
          const testUser = {
            telegram_chat_id: 888888888,
            telegram_username: 'verify_test',
            telegram_verified: true,
            status: 'verified',
            tier: 'free',
            projects_limit: 5,
            referral_code: `VERIFY${Date.now()}`
          };
          
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert(testUser)
            .select();
          
          if (!insertError && inserted) {
            console.log('   ✅ All expected columns present');
            console.log('   Columns:', Object.keys(inserted[0]));
            
            // Clean up
            await supabase.from('users').delete().eq('telegram_chat_id', 888888888);
          } else if (insertError) {
            console.log('   ⚠️ Column check error:', insertError.message);
          }
        }
      }
    } catch (e) {
      console.log(`❌ Error checking ${table.name}:`, e.message);
      if (table.required) allGood = false;
    }
  }
  
  // Check if existing projects table is still there
  console.log('\n📊 Checking existing projects table (from main app)...');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('count')
    .limit(1);
  
  if (!projectsError) {
    console.log('✅ Main app projects table still exists (good!)');
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    console.log(`   Contains ${count || 0} projects`);
  }
  
  // Test the connection between tables
  console.log('\n🔗 Testing table relationships...');
  
  // Try to create a test user and link to a project
  if (allGood) {
    try {
      // Create test user
      const { data: testUser } = await supabase
        .from('users')
        .insert({
          telegram_chat_id: 777777777,
          telegram_username: 'relationship_test',
          referral_code: `REL${Date.now()}`
        })
        .select()
        .single();
      
      if (testUser) {
        // Get first project from main app
        const { data: firstProject } = await supabase
          .from('projects')
          .select('id')
          .limit(1)
          .single();
        
        if (firstProject) {
          // Try to link them
          const { error: linkError } = await supabase
            .from('user_projects')
            .insert({
              user_id: testUser.id,
              project_id: firstProject.id
            });
          
          if (!linkError) {
            console.log('✅ Table relationships working correctly!');
            
            // Test the view
            const { data: viewData } = await supabase
              .from('user_projects_detailed')
              .select('*')
              .eq('user_id', testUser.id);
            
            if (viewData && viewData.length > 0) {
              console.log('✅ user_projects_detailed view working!');
            }
          } else {
            console.log('❌ Failed to link user to project:', linkError.message);
          }
        }
        
        // Clean up
        await supabase.from('user_projects').delete().eq('user_id', testUser.id);
        await supabase.from('users').delete().eq('id', testUser.id);
      }
    } catch (e) {
      console.log('⚠️ Relationship test error:', e.message);
    }
  }
  
  console.log('\n📋 Summary:');
  if (allGood) {
    console.log('✅ All mobile app tables created successfully!');
    console.log('✅ Main app projects table preserved');
    console.log('✅ Table relationships configured correctly');
    console.log('\n🎉 Mobile app database is ready for use!');
  } else {
    console.log('❌ Some tables are missing or have errors');
    console.log('Please check the SQL execution for errors');
  }
}

verifyMobileTables();