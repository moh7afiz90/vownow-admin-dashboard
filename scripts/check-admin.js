const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nukophdrrycvhivztujf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51a29waGRycnljdmhpdnp0dWpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc4MDkyOCwiZXhwIjoyMDczMzU2OTI4fQ.f67oqXp1TeNgvowRIIQkrbHc2UmkBvLrq-BEi-lVV9Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminUser() {
  console.log('🔍 Checking for admin users in the database...\n');

  try {
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log('📊 Users in auth.users table:');
    console.log('════════════════════════════════════════════');
    authUsers.users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`ID: ${user.id}`);
      console.log(`Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('────────────────────────────────────────────');
    });

    // Check if admin@vownow.com exists
    const adminUser = authUsers.users.find(u => u.email === 'admin@vownow.com');
    if (adminUser) {
      console.log('✅ Found admin@vownow.com in auth.users');
      console.log(`   User ID: ${adminUser.id}`);
    } else {
      console.log('❌ admin@vownow.com NOT found in auth.users');
    }

    // Check profiles table
    console.log('\n📊 Checking profiles table:');
    console.log('════════════════════════════════════════════');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    if (profilesError) {
      if (profilesError.code === 'PGRST205') {
        console.log('❌ profiles table does not exist!');
        console.log('   Please run the setup-tables.sql script in Supabase SQL Editor');
      } else {
        console.error('Error fetching profiles:', profilesError);
      }
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('Admin users in profiles table:');
      profiles.forEach(profile => {
        console.log(`Email: ${profile.email}`);
        console.log(`Name: ${profile.full_name || 'Not set'}`);
        console.log(`Role: ${profile.role}`);
        console.log(`Status: ${profile.status}`);
        console.log('────────────────────────────────────────────');
      });
    } else {
      console.log('❌ No admin users found in profiles table');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('════════════════════════════════════════════');
    if (adminUser) {
      if (profiles && profiles.find(p => p.email === 'admin@vownow.com')) {
        console.log('✅ admin@vownow.com is fully set up and ready to use!');
        console.log('\n🔐 Login credentials:');
        console.log('   Email: admin@vownow.com');
        console.log('   Password: Admin123!@#');
        console.log('   URL: http://localhost:3001/admin/login');
      } else {
        console.log('⚠️  admin@vownow.com exists in auth but not in profiles table');
        console.log('   Run the setup-tables.sql script to complete setup');
      }
    } else {
      console.log('❌ Admin user not found. Run create-admin.js to create it');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAdminUser();