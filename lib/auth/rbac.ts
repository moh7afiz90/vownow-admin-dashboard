import type { AdminUserRole } from '@/lib/types/database.types';

/**
 * Role-Based Access Control (RBAC) System
 */

export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

export interface RolePermissions {
  role: AdminUserRole;
  permissions: Permission[];
  inherits?: AdminUserRole[];
}

// Define permissions for each resource
export const PERMISSIONS = {
  // User management
  USERS_READ: { resource: 'users', action: 'read' },
  USERS_CREATE: { resource: 'users', action: 'create' },
  USERS_UPDATE: { resource: 'users', action: 'update' },
  USERS_DELETE: { resource: 'users', action: 'delete' },
  USERS_IMPERSONATE: { resource: 'users', action: 'impersonate' },

  // Analytics
  ANALYTICS_READ: { resource: 'analytics', action: 'read' },
  ANALYTICS_EXPORT: { resource: 'analytics', action: 'export' },

  // Reports
  REPORTS_READ: { resource: 'reports', action: 'read' },
  REPORTS_CREATE: { resource: 'reports', action: 'create' },
  REPORTS_UPDATE: { resource: 'reports', action: 'update' },
  REPORTS_DELETE: { resource: 'reports', action: 'delete' },
  REPORTS_SCHEDULE: { resource: 'reports', action: 'schedule' },

  // System settings
  SETTINGS_READ: { resource: 'settings', action: 'read' },
  SETTINGS_UPDATE: { resource: 'settings', action: 'update' },
  SETTINGS_SYSTEM: { resource: 'settings', action: 'system' },

  // Admin management
  ADMINS_READ: { resource: 'admins', action: 'read' },
  ADMINS_CREATE: { resource: 'admins', action: 'create' },
  ADMINS_UPDATE: { resource: 'admins', action: 'update' },
  ADMINS_DELETE: { resource: 'admins', action: 'delete' },
  ADMINS_ROLES: { resource: 'admins', action: 'roles' },

  // Audit logs
  AUDIT_READ: { resource: 'audit', action: 'read' },
  AUDIT_EXPORT: { resource: 'audit', action: 'export' },

  // System operations
  SYSTEM_MAINTENANCE: { resource: 'system', action: 'maintenance' },
  SYSTEM_BACKUP: { resource: 'system', action: 'backup' },
  SYSTEM_LOGS: { resource: 'system', action: 'logs' },
} as const;

// Role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<AdminUserRole, RolePermissions> = {
  super_admin: {
    role: 'super_admin',
    permissions: Object.values(PERMISSIONS), // All permissions
  },

  admin: {
    role: 'admin',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_UPDATE,
      PERMISSIONS.REPORTS_DELETE,
      PERMISSIONS.REPORTS_SCHEDULE,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE,
      PERMISSIONS.ADMINS_READ,
      PERMISSIONS.AUDIT_READ,
    ],
  },

  analyst: {
    role: 'analyst',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_CREATE,
      PERMISSIONS.REPORTS_UPDATE,
      PERMISSIONS.REPORTS_SCHEDULE,
    ],
  },

  viewer: {
    role: 'viewer',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.REPORTS_READ,
    ],
  },
};

/**
 * RBAC Manager Class
 */
export class RBACManager {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(
    role: AdminUserRole,
    resource: string,
    action: string,
    scope?: string
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    if (!rolePermissions) return false;

    return rolePermissions.permissions.some(permission => {
      const resourceMatch = permission.resource === resource;
      const actionMatch = permission.action === action;
      const scopeMatch = !scope || !permission.scope || permission.scope === scope;

      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  /**
   * Check multiple permissions at once
   */
  static hasAnyPermission(
    role: AdminUserRole,
    permissions: Array<{ resource: string; action: string; scope?: string }>
  ): boolean {
    return permissions.some(permission =>
      this.hasPermission(role, permission.resource, permission.action, permission.scope)
    );
  }

  /**
   * Check if user has all specified permissions
   */
  static hasAllPermissions(
    role: AdminUserRole,
    permissions: Array<{ resource: string; action: string; scope?: string }>
  ): boolean {
    return permissions.every(permission =>
      this.hasPermission(role, permission.resource, permission.action, permission.scope)
    );
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: AdminUserRole): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions ? rolePermissions.permissions : [];
  }

  /**
   * Check if one role has higher privileges than another
   */
  static isHigherRole(role1: AdminUserRole, role2: AdminUserRole): boolean {
    const roleHierarchy: Record<AdminUserRole, number> = {
      viewer: 1,
      analyst: 2,
      admin: 3,
      super_admin: 4,
    };

    return roleHierarchy[role1] > roleHierarchy[role2];
  }

  /**
   * Get available actions for a resource based on role
   */
  static getResourceActions(role: AdminUserRole, resource: string): string[] {
    const rolePermissions = ROLE_PERMISSIONS[role];
    if (!rolePermissions) return [];

    return rolePermissions.permissions
      .filter(permission => permission.resource === resource)
      .map(permission => permission.action);
  }

  /**
   * Check if role can perform action on specific route
   */
  static canAccessRoute(role: AdminUserRole, route: string): boolean {
    // Route-based permissions mapping
    const routePermissions: Record<string, { resource: string; action: string }> = {
      '/admin/dashboard': { resource: 'analytics', action: 'read' },
      '/admin/users': { resource: 'users', action: 'read' },
      '/admin/users/create': { resource: 'users', action: 'create' },
      '/admin/users/edit': { resource: 'users', action: 'update' },
      '/admin/analytics': { resource: 'analytics', action: 'read' },
      '/admin/reports': { resource: 'reports', action: 'read' },
      '/admin/reports/create': { resource: 'reports', action: 'create' },
      '/admin/settings': { resource: 'settings', action: 'read' },
      '/admin/settings/system': { resource: 'settings', action: 'system' },
      '/admin/audit': { resource: 'audit', action: 'read' },
    };

    // Find the most specific route match
    let matchedRoute = '';
    let matchedPermission = null;

    for (const [routePath, permission] of Object.entries(routePermissions)) {
      if (route.startsWith(routePath) && routePath.length > matchedRoute.length) {
        matchedRoute = routePath;
        matchedPermission = permission;
      }
    }

    if (!matchedPermission) {
      // Default to analytics read for unmapped admin routes
      return this.hasPermission(role, 'analytics', 'read');
    }

    return this.hasPermission(role, matchedPermission.resource, matchedPermission.action);
  }

  /**
   * Filter menu items based on user permissions
   */
  static filterMenuItems(
    role: AdminUserRole,
    menuItems: Array<{
      path: string;
      requiredPermission?: { resource: string; action: string };
    }>
  ) {
    return menuItems.filter(item => {
      if (!item.requiredPermission) return true;

      return this.hasPermission(
        role,
        item.requiredPermission.resource,
        item.requiredPermission.action
      );
    });
  }
}

/**
 * Permission check decorators/HOCs
 */
export const withPermission = (
  resource: string,
  action: string,
  scope?: string
) => {
  return (role: AdminUserRole) => {
    return RBACManager.hasPermission(role, resource, action, scope);
  };
};

/**
 * Common permission checks
 */
export const PermissionChecks = {
  canManageUsers: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'users', 'update'),

  canCreateReports: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'reports', 'create'),

  canViewAnalytics: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'analytics', 'read'),

  canManageSettings: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'settings', 'update'),

  canViewAudit: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'audit', 'read'),

  canManageAdmins: (role: AdminUserRole) =>
    RBACManager.hasPermission(role, 'admins', 'update'),

  isSuperAdmin: (role: AdminUserRole) =>
    role === 'super_admin',
};