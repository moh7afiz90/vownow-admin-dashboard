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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetAdminPassword() {
  const email = 'admin@vownow.com';
  const newPassword = 'Admin@123456'; // The password you want to use

  console.log('Resetting admin password...\n');

  try {
    // First, list all users to find the admin
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const adminUser = users.users.find(u => u.email === email);

    if (!adminUser) {
      console.log('Admin user not found. Creating new admin user...');

      // Create the admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }

      console.log('✅ Admin user created successfully');
      console.log('User ID:', newUser.user.id);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          role: 'admin',
          status: 'active',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('✅ Admin profile created');
      }

    } else {
      console.log('Admin user found. User ID:', adminUser.id);
      console.log('Current email:', adminUser.email);
      console.log('Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');

      // Update the password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        {
          password: newPassword,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return;
      }

      console.log('✅ Password reset successfully');

      // Ensure profile exists with admin role
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();

      if (profileFetchError && profileFetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: adminUser.id,
            email: email,
            role: 'admin',
            status: 'active',
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('✅ Admin profile created');
        }
      } else if (profile) {
        // Update role if needed
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          const { error: updateRoleError } = await supabase
            .from('profiles')
            .update({ role: 'admin', status: 'active' })
            .eq('id', adminUser.id);

          if (updateRoleError) {
            console.error('Error updating role:', updateRoleError);
          } else {
            console.log('✅ Profile role updated to admin');
          }
        } else {
          console.log('✅ Profile already has admin role');
        }
      }
    }

    // Test the login
    console.log('\n📝 Testing login with new credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (authError) {
      console.error('❌ Login test failed:', authError.message);
    } else {
      console.log('✅ Login test successful!');
      await supabase.auth.signOut();
    }

    console.log('\n========================================');
    console.log('Admin credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('========================================');
    console.log('\nYou can now login at http://localhost:3001/admin/login');

  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();