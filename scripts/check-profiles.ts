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

async function checkProfiles() {
  console.log('Checking all profiles in database...\n');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found in database');
      console.log('\nCreating admin profile directly...');

      // Get the user ID for admin@vownow.com
      const { data: users } = await supabase.auth.admin.listUsers();
      const adminUser = users?.users.find(u => u.email === 'admin@vownow.com');

      if (adminUser) {
        console.log('Found admin user ID:', adminUser.id);

        // Insert profile directly
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: adminUser.id,
            email: 'admin@vownow.com',
            role: 'admin',
            status: 'active',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('✅ Profile created:', newProfile);
        }
      } else {
        console.log('Admin user not found in auth');
      }
    } else {
      console.log(`Found ${profiles.length} profile(s):\n`);
      profiles.forEach((profile, index) => {
        console.log(`Profile ${index + 1}:`);
        console.log('  ID:', profile.id);
        console.log('  Email:', profile.email);
        console.log('  Role:', profile.role);
        console.log('  Status:', profile.status);
        console.log('');
      });

      // Check for admin@vownow.com
      const adminProfile = profiles.find(p => p.email === 'admin@vownow.com');
      if (!adminProfile) {
        console.log('⚠️  admin@vownow.com profile not found');

        // Get the user ID and create profile
        const { data: users } = await supabase.auth.admin.listUsers();
        const adminUser = users?.users.find(u => u.email === 'admin@vownow.com');

        if (adminUser) {
          console.log('Creating profile for admin@vownow.com (ID: ' + adminUser.id + ')...');

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: adminUser.id,
              email: 'admin@vownow.com',
              role: 'admin',
              status: 'active',
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            console.log('✅ Profile created:', newProfile);
          }
        }
      } else if (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin') {
        console.log('⚠️  admin@vownow.com has role:', adminProfile.role);
        console.log('Updating to admin role...');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', adminProfile.id);

        if (updateError) {
          console.error('Error updating role:', updateError);
        } else {
          console.log('✅ Role updated to admin');
        }
      }
    }

  } catch (error) {
    console.error('Check error:', error);
  }
}

checkProfiles();