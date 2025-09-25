'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import type { AdminUserRole } from '@/lib/types/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: {
    resource: string;
    action: string;
    scope?: string;
  };
  requiredRole?: AdminUserRole;
  requiresTwoFactor?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
  showUnauthorized?: boolean;
}

/**
 * Higher-Order Component for protecting routes with role-based access control
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  requiresTwoFactor = false,
  fallback,
  redirectTo = '/admin/login',
  showUnauthorized = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const {
    user,
    adminUser,
    role,
    loading,
    error,
    twoFactorVerified,
    hasPermission,
  } = usePermissions();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Redirect if no user or admin user
    if (!user || !adminUser || !role) {
      const currentUrl = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`;
      router.replace(redirectUrl);
      return;
    }

    // Check if account is active
    if (!adminUser.is_active) {
      router.replace(`${redirectTo}?error=deactivated`);
      return;
    }

    // Check role requirement
    if (requiredRole && role !== requiredRole) {
      if (showUnauthorized) {
        return; // Show unauthorized message instead of redirecting
      }
      router.replace('/admin/dashboard?error=insufficient_permissions');
      return;
    }

    // Check permission requirement
    if (requiredPermission) {
      const hasRequiredPermission = hasPermission(
        requiredPermission.resource,
        requiredPermission.action,
        requiredPermission.scope
      );

      if (!hasRequiredPermission) {
        if (showUnauthorized) {
          return; // Show unauthorized message instead of redirecting
        }
        router.replace('/admin/dashboard?error=insufficient_permissions');
        return;
      }
    }

    // Check 2FA requirement
    if (requiresTwoFactor && adminUser.two_factor_enabled && !twoFactorVerified) {
      const currentUrl = window.location.pathname;
      const redirectUrl = `/admin/login/2fa?redirect=${encodeURIComponent(currentUrl)}`;
      router.replace(redirectUrl);
      return;
    }
  }, [
    loading,
    user,
    adminUser,
    role,
    twoFactorVerified,
    requiredRole,
    requiredPermission,
    requiresTwoFactor,
    hasPermission,
    router,
    redirectTo,
    showUnauthorized,
  ]);

  // Show loading state
  if (loading) {
    return fallback || <ProtectedRouteLoader />;
  }

  // Show error state
  if (error) {
    return <ProtectedRouteError error={error} />;
  }

  // Check basic authentication
  if (!user || !adminUser || !role) {
    return fallback || <ProtectedRouteLoader />;
  }

  // Check if account is deactivated
  if (!adminUser.is_active) {
    return <DeactivatedAccountError />;
  }

  // Check role requirement
  if (requiredRole && role !== requiredRole) {
    return showUnauthorized ? <UnauthorizedError requiredRole={requiredRole} userRole={role} /> : null;
  }

  // Check permission requirement
  if (requiredPermission) {
    const hasRequiredPermission = hasPermission(
      requiredPermission.resource,
      requiredPermission.action,
      requiredPermission.scope
    );

    if (!hasRequiredPermission) {
      return showUnauthorized ? (
        <UnauthorizedError permission={requiredPermission} userRole={role} />
      ) : null;
    }
  }

  // Check 2FA requirement
  if (requiresTwoFactor && adminUser.two_factor_enabled && !twoFactorVerified) {
    return <TwoFactorRequiredError />;
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Loading component for protected routes
 */
function ProtectedRouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Error component for authentication errors
 */
function ProtectedRouteError({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Authentication Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Unauthorized access error component
 */
function UnauthorizedError({
  requiredRole,
  permission,
  userRole,
}: {
  requiredRole?: AdminUserRole;
  permission?: { resource: string; action: string };
  userRole?: AdminUserRole | null;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <h2 className="font-medium text-lg mb-2">Access Denied</h2>
          <p className="text-sm mb-2">
            You don't have sufficient permissions to access this page.
          </p>
          {requiredRole && (
            <p className="text-sm">
              Required role: <span className="font-medium">{requiredRole}</span>
              {userRole && (
                <>
                  <br />
                  Your role: <span className="font-medium">{userRole}</span>
                </>
              )}
            </p>
          )}
          {permission && (
            <p className="text-sm">
              Required permission: <span className="font-medium">
                {permission.resource}:{permission.action}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mr-2"
        >
          Go Back
        </button>
        <button
          onClick={() => window.location.href = '/admin/dashboard'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}

/**
 * Deactivated account error component
 */
function DeactivatedAccountError() {
  const { signOut } = usePermissions();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-medium text-lg mb-2">Account Deactivated</h2>
          <p className="text-sm">
            Your admin account has been deactivated. Please contact your system administrator.
          </p>
        </div>
        <button
          onClick={signOut}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

/**
 * Two-factor authentication required error component
 */
function TwoFactorRequiredError() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <h2 className="font-medium text-lg mb-2">Two-Factor Authentication Required</h2>
          <p className="text-sm">
            This page requires two-factor authentication verification.
          </p>
        </div>
        <button
          onClick={() => {
            const currentUrl = window.location.pathname;
            router.push(`/admin/login/2fa?redirect=${encodeURIComponent(currentUrl)}`);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Verify 2FA
        </button>
      </div>
    </div>
  );
}

/**
 * Convenience wrapper for routes requiring specific permissions
 */
export function withPermission(
  requiredPermission: { resource: string; action: string; scope?: string }
) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionProtectedComponent(props: P) {
      return (
        <ProtectedRoute requiredPermission={requiredPermission}>
          <Component {...props} />
        </ProtectedRoute>
      );
    };
  };
}

/**
 * Convenience wrapper for routes requiring specific roles
 */
export function withRole(requiredRole: AdminUserRole) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function RoleProtectedComponent(props: P) {
      return (
        <ProtectedRoute requiredRole={requiredRole}>
          <Component {...props} />
        </ProtectedRoute>
      );
    };
  };
}

/**
 * Convenience wrapper for routes requiring 2FA
 */
export function withTwoFactor<P extends object>(Component: React.ComponentType<P>) {
  return function TwoFactorProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiresTwoFactor={true}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}