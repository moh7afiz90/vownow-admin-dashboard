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

  // Return in legacy format for backward compatibility
  return {
    user,
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
    // Use anon key for authentication, not service role
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // Use service role client to check admin role
    const adminSupabase = createServiceRoleClient();
    const { data: adminUser, error: adminUserError } = await adminSupabase
      .from('admin_users')
      .select('id, email, role, is_active, two_factor_enabled, two_factor_secret')
      .eq('id', data.user.id)
      .single();

    if (adminUserError || !adminUser) {
      console.error('Admin user fetch error:', adminUserError);
      await supabase.auth.signOut();
      return { error: 'Unauthorized: Admin access only' };
    }

    console.log('User admin role:', adminUser.role);

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

    // No 2FA required, set session cookie
    const cookieStore = await cookies();
    const sessionToken = Buffer.from(JSON.stringify({
      userId: data.user.id,
      email: data.user.email,
      role: adminUser.role,
      timestamp: Date.now(),
    })).toString('base64');

    cookieStore.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/admin',
    });

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

    // Also clear legacy cookies for backward compatibility
    const cookieStore = await cookies();
    cookieStore.delete('admin-token');
    cookieStore.delete('admin-session');

    console.log('Admin signed out successfully');
  } catch (error) {
    console.error('Error during admin sign out:', error);
    throw error;
  }
}