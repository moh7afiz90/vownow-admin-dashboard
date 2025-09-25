'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { RBACManager, PermissionChecks } from '@/lib/auth/rbac';
import { ClientSessionManager } from '@/lib/auth/session';
import type { AdminUserRole, AdminUser } from '@/lib/types/database.types';
import type { User } from '@supabase/supabase-js';

interface UsePermissionsState {
  user: User | null;
  adminUser: AdminUser | null;
  role: AdminUserRole | null;
  loading: boolean;
  error: string | null;
  twoFactorVerified: boolean;
}

interface PermissionHookResult extends UsePermissionsState {
  // Permission checks
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string; scope?: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ resource: string; action: string; scope?: string }>) => boolean;
  canAccessRoute: (route: string) => boolean;

  // Common permission checks
  canManageUsers: boolean;
  canCreateReports: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canViewAudit: boolean;
  canManageAdmins: boolean;
  isSuperAdmin: boolean;

  // Actions
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): PermissionHookResult {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();

  const [state, setState] = useState<UsePermissionsState>({
    user: null,
    adminUser: null,
    role: null,
    loading: true,
    error: null,
    twoFactorVerified: false,
  });

  // Load user and admin data
  const loadUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get current user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setState({
          user: null,
          adminUser: null,
          role: null,
          loading: false,
          error: userError?.message || 'No user found',
          twoFactorVerified: false,
        });
        return;
      }

      // Get admin user data
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError || !adminUser) {
        setState({
          user,
          adminUser: null,
          role: null,
          loading: false,
          error: 'User is not an admin',
          twoFactorVerified: false,
        });
        return;
      }

      if (!adminUser.is_active) {
        setState({
          user,
          adminUser,
          role: adminUser.role,
          loading: false,
          error: 'Admin account is deactivated',
          twoFactorVerified: false,
        });
        return;
      }

      // Check 2FA verification status from localStorage or cookie
      let twoFactorVerified = false;
      if (typeof window !== 'undefined') {
        const twoFactorData = localStorage.getItem('admin-2fa-verified');
        if (twoFactorData) {
          try {
            const parsed = JSON.parse(twoFactorData);
            const now = Date.now();
            const sessionAge = now - parsed.timestamp;
            const oneHour = 60 * 60 * 1000;

            twoFactorVerified = sessionAge <= oneHour && parsed.userId === user.id;
          } catch {
            twoFactorVerified = false;
          }
        }

        // If 2FA is not enabled, consider as verified
        if (!adminUser.two_factor_enabled) {
          twoFactorVerified = true;
        }
      }

      setState({
        user,
        adminUser,
        role: adminUser.role,
        loading: false,
        error: null,
        twoFactorVerified,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load user data',
      }));
    }
  }, [supabase]);

  // Permission checking functions
  const hasPermission = useCallback(
    (resource: string, action: string, scope?: string): boolean => {
      if (!state.role) return false;
      return RBACManager.hasPermission(state.role, resource, action, scope);
    },
    [state.role]
  );

  const hasAnyPermission = useCallback(
    (permissions: Array<{ resource: string; action: string; scope?: string }>): boolean => {
      if (!state.role) return false;
      return RBACManager.hasAnyPermission(state.role, permissions);
    },
    [state.role]
  );

  const hasAllPermissions = useCallback(
    (permissions: Array<{ resource: string; action: string; scope?: string }>): boolean => {
      if (!state.role) return false;
      return RBACManager.hasAllPermissions(state.role, permissions);
    },
    [state.role]
  );

  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!state.role) return false;
      return RBACManager.canAccessRoute(state.role, route);
    },
    [state.role]
  );

  // Common permission checks
  const permissions = useMemo(() => {
    if (!state.role) {
      return {
        canManageUsers: false,
        canCreateReports: false,
        canViewAnalytics: false,
        canManageSettings: false,
        canViewAudit: false,
        canManageAdmins: false,
        isSuperAdmin: false,
      };
    }

    return {
      canManageUsers: PermissionChecks.canManageUsers(state.role),
      canCreateReports: PermissionChecks.canCreateReports(state.role),
      canViewAnalytics: PermissionChecks.canViewAnalytics(state.role),
      canManageSettings: PermissionChecks.canManageSettings(state.role),
      canViewAudit: PermissionChecks.canViewAudit(state.role),
      canManageAdmins: PermissionChecks.canManageAdmins(state.role),
      isSuperAdmin: PermissionChecks.isSuperAdmin(state.role),
    };
  }, [state.role]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await ClientSessionManager.signOut();
      setState({
        user: null,
        adminUser: null,
        role: null,
        loading: false,
        error: null,
        twoFactorVerified: false,
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [router]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Initialize and set up auth state change listener
  useEffect(() => {
    loadUserData();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            adminUser: null,
            role: null,
            loading: false,
            error: null,
            twoFactorVerified: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          loadUserData();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, supabase.auth]);

  // Check route access on pathname change
  useEffect(() => {
    if (!state.loading && state.user && state.role) {
      const hasAccess = canAccessRoute(pathname);
      if (!hasAccess) {
        console.warn(`User lacks permission to access route: ${pathname}`);
        // Optionally redirect to dashboard or show error
      }
    }
  }, [pathname, state.loading, state.user, state.role, canAccessRoute]);

  // Listen for cross-tab session changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'admin-user' && !event.newValue) {
        // User was logged out in another tab
        setState({
          user: null,
          adminUser: null,
          role: null,
          loading: false,
          error: null,
          twoFactorVerified: false,
        });
        router.replace('/admin/login');
      } else if (event.key === 'admin-2fa-verified') {
        // 2FA status changed in another tab
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, loadUserData]);

  return {
    ...state,
    ...permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    signOut,
    refreshPermissions,
  };
}