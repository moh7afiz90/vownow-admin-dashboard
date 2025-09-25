import { cookies } from 'next/headers';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AdminUser } from '@/lib/types/database.types';

export interface AdminSession {
  user: User;
  adminUser: AdminUser;
  twoFactorVerified: boolean;
}

export interface SessionError {
  error: string;
  code?: string;
}

export type SessionResult =
  | { success: true; session: AdminSession }
  | { success: false; error: SessionError };

/**
 * Server-side session management
 */
export class ServerSessionManager {
  /**
   * Get the current admin session from server-side context
   */
  static async getCurrentSession(): Promise<SessionResult> {
    try {
      const supabase = await createServerClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: { error: 'No authenticated user', code: 'NO_USER' },
        };
      }

      // Get admin user data
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError || !adminUser) {
        return {
          success: false,
          error: { error: 'User is not an admin', code: 'NOT_ADMIN' },
        };
      }

      if (!adminUser.is_active) {
        return {
          success: false,
          error: { error: 'Admin account is deactivated', code: 'DEACTIVATED' },
        };
      }

      // Check 2FA verification status
      const cookieStore = await cookies();
      const twoFactorCookie = cookieStore.get('admin-2fa-verified');
      let twoFactorVerified = false;

      if (twoFactorCookie && adminUser.two_factor_enabled) {
        try {
          const twoFactorData = JSON.parse(twoFactorCookie.value);
          const now = Date.now();
          const sessionAge = now - twoFactorData.timestamp;
          const oneHour = 60 * 60 * 1000;

          twoFactorVerified = sessionAge <= oneHour && twoFactorData.userId === user.id;
        } catch {
          // Invalid 2FA cookie format
          twoFactorVerified = false;
        }
      } else if (!adminUser.two_factor_enabled) {
        // 2FA not enabled, consider as verified
        twoFactorVerified = true;
      }

      return {
        success: true,
        session: {
          user,
          adminUser,
          twoFactorVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { error: 'Session validation failed', code: 'VALIDATION_ERROR' },
      };
    }
  }

  /**
   * Set 2FA verification cookie
   */
  static async setTwoFactorVerified(userId: string): Promise<void> {
    const cookieStore = await cookies();
    const twoFactorData = {
      userId,
      timestamp: Date.now(),
      verified: true,
    };

    cookieStore.set('admin-2fa-verified', JSON.stringify(twoFactorData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/admin',
    });
  }

  /**
   * Clear 2FA verification cookie
   */
  static async clearTwoFactorVerified(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('admin-2fa-verified');
  }

  /**
   * Clear all session cookies
   */
  static async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('admin-2fa-verified');

    // Clear Supabase auth cookies
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }

  /**
   * Log admin action to audit trail
   */
  static async logAction(
    action: string,
    details: Record<string, any> = {},
    affectedUserId?: string
  ): Promise<void> {
    try {
      const sessionResult = await this.getCurrentSession();
      if (!sessionResult.success) return;

      const supabase = createServiceRoleClient();
      await supabase.rpc('log_admin_action', {
        p_admin_id: sessionResult.session.user.id,
        p_action: action,
        p_details: details,
        p_affected_user_id: affectedUserId || null,
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }
}

/**
 * Client-side session management
 */
export class ClientSessionManager {
  private static supabase = createBrowserClient();

  /**
   * Get current user session from client-side
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: any) => void
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<void> {
    await this.supabase.auth.signOut();

    // Clear local storage
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('admin-user');
      window.localStorage.removeItem('admin-session');
    }
  }

  /**
   * Check if session is valid
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      return !error && !!session;
    } catch {
      return false;
    }
  }

  /**
   * Refresh session
   */
  static async refreshSession() {
    return await this.supabase.auth.refreshSession();
  }
}

/**
 * Utility functions for session management
 */
export const sessionUtils = {
  /**
   * Get user role permissions
   */
  getRolePermissions(role: string): string[] {
    switch (role) {
      case 'super_admin':
        return ['*']; // All permissions
      case 'admin':
        return [
          'users.read',
          'users.write',
          'analytics.read',
          'reports.read',
          'reports.write',
          'settings.read',
          'settings.write',
        ];
      case 'analyst':
        return [
          'users.read',
          'analytics.read',
          'reports.read',
          'reports.write',
        ];
      case 'viewer':
        return [
          'users.read',
          'analytics.read',
          'reports.read',
        ];
      default:
        return [];
    }
  },

  /**
   * Check if user has specific permission
   */
  hasPermission(userRole: string, permission: string): boolean {
    const permissions = this.getRolePermissions(userRole);
    return permissions.includes('*') || permissions.includes(permission);
  },

  /**
   * Check if route requires 2FA
   */
  requiresTwoFactor(pathname: string): boolean {
    const twoFactorRoutes = [
      '/admin/users',
      '/admin/settings',
      '/admin/audit',
    ];

    return twoFactorRoutes.some(route => pathname.startsWith(route));
  },

  /**
   * Generate session token
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};