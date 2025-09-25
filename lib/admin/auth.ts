import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';
import { ServerSessionManager } from '@/lib/auth/session';
import type { AdminUser } from '@/lib/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Legacy function for backward compatibility
export const createAdminClient = () => {
  return createServiceRoleClient();
};

export async function getAdminSession() {
  const sessionResult = await ServerSessionManager.getCurrentSession();

  if (!sessionResult.success) {
    return null;
  }

  const { user, adminUser } = sessionResult.session;

  // Return session data
  return {
    user: {
      id: user.id,
      email: user.email!,
      role: adminUser.role,
    },
    profile: {
      role: adminUser.role,
      id: adminUser.id,
      email: adminUser.email,
    }
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return session;
}

export async function signInAdmin(email: string, password: string) {
  console.log('Attempting admin login for:', email);

  try {
    // Use the server-side Supabase client for proper cookie handling
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);

      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid credentials' };
      } else if (error.message.includes('Email not confirmed')) {
        return { error: 'Email not confirmed' };
      }

      return { error: error.message };
    }

    if (!data.user) {
      console.error('No user found in response');
      return { error: 'User not found' };
    }

    console.log('User authenticated, checking admin role for ID:', data.user.id);

    // Use service role client to check admin role in profiles table
    const adminSupabase = createServiceRoleClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('id', data.user.id)
      .single() as { data: { id: string; email: string | null; role: string; status: string } | null; error: any };

    // Map profile data to AdminUser structure
    const adminUser = profile ? {
      id: profile.id,
      email: profile.email || data.user.email,
      role: profile.role,
      is_active: profile.status === 'active',
      two_factor_enabled: false,
      two_factor_secret: undefined
    } : null;

    const adminUserError = profileError;

    if (adminUserError || !adminUser) {
      console.error('Admin user fetch error:', adminUserError);
      await supabase.auth.signOut();
      return { error: 'Unauthorized: Admin access only' };
    }

    console.log('User admin role:', adminUser.role);

    // Check if user has admin role
    if (!['admin', 'super_admin'].includes(adminUser.role)) {
      console.error('User does not have admin role:', adminUser.role);
      await supabase.auth.signOut();
      return { error: 'Unauthorized: Admin access only' };
    }

    if (!adminUser.is_active) {
      await supabase.auth.signOut();
      return { error: 'Account deactivated' };
    }

    // Check if 2FA is enabled
    if (adminUser.two_factor_enabled && adminUser.two_factor_secret) {
      // Create temporary token for 2FA flow
      const temporaryToken = Buffer.from(JSON.stringify({
        userId: data.user.id,
        timestamp: Date.now(),
        step: '2fa_required',
      })).toString('base64');

      // Don't set session cookie yet - wait for 2FA verification
      return {
        success: true,
        requiresTwoFactor: true,
        temporaryToken,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    }

    // No 2FA required - Supabase auth helpers will handle session cookies
    // Log successful login
    await ServerSessionManager.logAction('admin_login_success', {
      userId: data.user.id,
      userAgent: 'server-side',
      twoFactorUsed: false,
    });

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: adminUser.role,
      }
    };

  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'Internal server error' };
  }
}

export async function signOutAdmin() {
  try {
    // Log the sign out action
    const sessionResult = await ServerSessionManager.getCurrentSession();
    if (sessionResult.success) {
      await ServerSessionManager.logAction('admin_logout', {
        userId: sessionResult.session.user.id,
      });
    }

    // Clear all session data using ServerSessionManager
    await ServerSessionManager.clearSession();

    console.log('Admin signed out successfully');
  } catch (error) {
    console.error('Error during admin sign out:', error);
    throw error;
  }
}