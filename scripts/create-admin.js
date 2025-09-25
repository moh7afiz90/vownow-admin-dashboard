const { createClient } = require('@supabase/supabase-js');

// Read directly from your environment
const supabaseUrl = 'https://nukophdrrycvhivztujf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51a29waGRycnljdmhpdnp0dWpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc4MDkyOCwiZXhwIjoyMDczMzU2OTI4fQ.f67oqXp1TeNgvowRIIQkrbHc2UmkBvLrq-BEi-lVV9Q';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@vownow.com';
  const password = 'Admin123!@#';

  try {
    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Admin user created in auth.users');
    console.log('User ID:', authData.user.id);

    // Create or update the profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('✅ Admin profile created in profiles table');
    console.log('\n🔐 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@vownow.com');
    console.log('Password: Admin123!@#');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYou can now login at: http://localhost:3001/admin/login');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();