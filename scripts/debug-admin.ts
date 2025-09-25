import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdmin() {
  const email = 'admin@vownow.com';
  const password = 'Admin@123456';

  console.log('Testing admin login flow...\n');

  try {
    // Test authentication
    console.log('1. Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);

    // Check profile
    console.log('\n2. Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);

      // Try to create the profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log('\nProfile not found, creating...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            role: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
        } else {
          console.log('✅ Profile created with admin role');
        }
      }
      return;
    }

    console.log('✅ Profile found:');
    console.log('  - ID:', profile.id);
    console.log('  - Email:', profile.email);
    console.log('  - Role:', profile.role);
    console.log('  - Status:', profile.status);

    // Check role
    console.log('\n3. Checking admin role...');
    if (!['admin', 'super_admin'].includes(profile.role)) {
      console.error(`❌ User does not have admin role. Current role: ${profile.role}`);
      console.log('\nUpdating role to admin...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('❌ Error updating role:', updateError);
      } else {
        console.log('✅ Role updated to admin');
      }
    } else {
      console.log('✅ User has admin role');
    }

    // Check status
    if (profile.status !== 'active') {
      console.error(`❌ Account is not active. Status: ${profile.status}`);
    } else {
      console.log('✅ Account is active');
    }

    // Sign out
    await supabase.auth.signOut();

    console.log('\n✅ All checks complete!');
    console.log('\nYou should now be able to login at http://localhost:3001/admin/login');

  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugAdmin();