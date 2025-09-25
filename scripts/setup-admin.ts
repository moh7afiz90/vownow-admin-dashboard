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

async function setupAdminUser() {
  const email = 'admin@vownow.com';
  const password = 'Admin@123456';

  console.log('Setting up admin user...');

  try {
    // Check if user exists
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserById(email).catch(() => ({ data: null, error: null }));

    let userId: string;

    // Create or get the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const existingAdmin = users.users.find(u => u.email === email);

    if (!existingAdmin) {
      // Create the user if they don't exist
      console.log('Creating admin user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
      }

      userId = newUser.user.id;
      console.log('Admin user created successfully');
    } else {
      userId = existingAdmin.id;
      console.log('Admin user already exists');

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
      } else {
        console.log('Admin password updated');
      }
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      process.exit(1);
    }

    if (!existingProfile) {
      // Create profile with admin role
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        process.exit(1);
      }

      console.log('Admin profile created with admin role');
    } else {
      // Update existing profile to have admin role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        process.exit(1);
      }

      console.log('Admin profile updated with admin role');
    }

    console.log('\n✅ Admin setup complete!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('\nYou can now login at http://localhost:3001/admin/login');

  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
}

setupAdminUser();