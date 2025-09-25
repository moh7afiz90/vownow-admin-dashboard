import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  userId: string;
  userEmail: string;
  adminId: string | null;
  adminEmail: string | null;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  metadata: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: PaginationInfo;
  filters: {
    user?: string;
    admin?: string;
    action?: string;
    resource?: string;
    outcome?: string;
    severity?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  summary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    criticalEvents: number;
    uniqueUsers: number;
    mostCommonActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

export interface ValidateFiltersResult {
  isValid: boolean;
  errors?: string[];
}

interface AuditLogFilters {
  page?: number;
  limit?: number;
  user?: string;
  admin?: string;
  action?: string;
  resource?: string;
  outcome?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogsResponse> {
  try {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        resource,
        resource_id,
        user_id,
        admin_id,
        timestamp,
        ip_address,
        user_agent,
        details,
        outcome,
        severity,
        session_id,
        metadata,
        users!audit_logs_user_id_fkey (
          email
        ),
        admin:users!audit_logs_admin_id_fkey (
          email
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.user) {
      query = query.eq('users.email', filters.user);
    }

    if (filters.admin) {
      query = query.eq('admin.email', filters.admin);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }

    if (filters.outcome) {
      query = query.eq('outcome', filters.outcome);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder === 'asc' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply pagination
    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const logs: AuditLog[] = (data || []).map((row: any) => ({
      id: row.id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      userId: row.user_id,
      userEmail: row.users?.email || 'unknown@example.com',
      adminId: row.admin_id,
      adminEmail: row.admin?.email || null,
      timestamp: row.timestamp,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      details: row.details || {},
      outcome: row.outcome,
      severity: row.severity,
      sessionId: row.session_id,
      metadata: row.metadata || {},
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Calculate summary stats
    const summary = await calculateSummaryStats(filters);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        user: filters.user,
        admin: filters.admin,
        action: filters.action,
        resource: filters.resource,
        outcome: filters.outcome,
        severity: filters.severity,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
      summary,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

export async function validateAuditLogFilters(filters: AuditLogFilters = {}): Promise<ValidateFiltersResult> {
  const errors: string[] = [];

  // Validate severity
  if (filters.severity) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(filters.severity)) {
      errors.push('Invalid severity level');
    }
  }

  // Validate outcome
  if (filters.outcome) {
    const validOutcomes = ['success', 'failure', 'error'];
    if (!validOutcomes.includes(filters.outcome)) {
      errors.push('Invalid outcome value');
    }
  }

  // Validate date formats
  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);
    if (isNaN(dateFrom.getTime())) {
      errors.push('Invalid dateFrom format');
    }
  }

  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    if (isNaN(dateTo.getTime())) {
      errors.push('Invalid dateTo format');
    }
  }

  // Validate date range
  if (filters.dateFrom && filters.dateTo) {
    const dateFrom = new Date(filters.dateFrom);
    const dateTo = new Date(filters.dateTo);
    if (dateFrom > dateTo) {
      errors.push('dateFrom cannot be after dateTo');
    }
  }

  // Validate page and limit
  if (filters.page !== undefined && filters.page < 1) {
    errors.push('Page must be greater than 0');
  }

  if (filters.limit !== undefined && (filters.limit < 1 || filters.limit > 100)) {
    errors.push('Limit must be between 1 and 100');
  }

  // Validate sort order
  if (filters.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
    errors.push('Sort order must be asc or desc');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function calculateSummaryStats(filters: AuditLogFilters = {}): Promise<AuditLogsResponse['summary']> {
  try {
    let baseQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true });

    // Apply the same filters as the main query (except pagination)
    if (filters.user) {
      baseQuery = baseQuery.eq('user_email', filters.user);
    }

    if (filters.admin) {
      baseQuery = baseQuery.eq('admin_email', filters.admin);
    }

    if (filters.action) {
      baseQuery = baseQuery.eq('action', filters.action);
    }

    if (filters.resource) {
      baseQuery = baseQuery.eq('resource', filters.resource);
    }

    if (filters.outcome) {
      baseQuery = baseQuery.eq('outcome', filters.outcome);
    }

    if (filters.severity) {
      baseQuery = baseQuery.eq('severity', filters.severity);
    }

    if (filters.dateFrom) {
      baseQuery = baseQuery.gte('timestamp', filters.dateFrom);
    }

    if (filters.dateTo) {
      baseQuery = baseQuery.lte('timestamp', filters.dateTo);
    }

    // Get total count
    const { count: totalActions } = await baseQuery;

    // Get successful actions count - create new query
    let successQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (filters.user) successQuery = successQuery.eq('user_email', filters.user);
    if (filters.admin) successQuery = successQuery.eq('admin_email', filters.admin);
    if (filters.action) successQuery = successQuery.eq('action', filters.action);
    if (filters.resource) successQuery = successQuery.eq('resource', filters.resource);
    const { count: successfulActions } = await successQuery.eq('outcome', 'success');

    // Get failed actions count - create new query
    let failQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (filters.user) failQuery = failQuery.eq('user_email', filters.user);
    if (filters.admin) failQuery = failQuery.eq('admin_email', filters.admin);
    if (filters.action) failQuery = failQuery.eq('action', filters.action);
    if (filters.resource) failQuery = failQuery.eq('resource', filters.resource);
    const { count: failedActions } = await failQuery.in('outcome', ['failure', 'error']);

    // Get critical events count - create new query
    let criticalQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (filters.user) criticalQuery = criticalQuery.eq('user_email', filters.user);
    if (filters.admin) criticalQuery = criticalQuery.eq('admin_email', filters.admin);
    if (filters.action) criticalQuery = criticalQuery.eq('action', filters.action);
    if (filters.resource) criticalQuery = criticalQuery.eq('resource', filters.resource);
    const { count: criticalEvents } = await criticalQuery.eq('severity', 'critical');

    // Get unique users count - create new query
    let usersQuery = supabase.from('audit_logs').select('user_id');
    if (filters.user) usersQuery = usersQuery.eq('user_email', filters.user);
    if (filters.admin) usersQuery = usersQuery.eq('admin_email', filters.admin);
    if (filters.action) usersQuery = usersQuery.eq('action', filters.action);
    if (filters.resource) usersQuery = usersQuery.eq('resource', filters.resource);
    const { data: uniqueUsersData } = await usersQuery.not('user_id', 'is', null);

    const uniqueUserIds = new Set(uniqueUsersData?.map(row => row.user_id) || []);
    const uniqueUsers = uniqueUserIds.size;

    // Get most common actions - create new query
    let actionsQuery = supabase.from('audit_logs').select('action');
    if (filters.user) actionsQuery = actionsQuery.eq('user_email', filters.user);
    if (filters.admin) actionsQuery = actionsQuery.eq('admin_email', filters.admin);
    if (filters.action) actionsQuery = actionsQuery.eq('action', filters.action);
    if (filters.resource) actionsQuery = actionsQuery.eq('resource', filters.resource);
    if (filters.outcome) actionsQuery = actionsQuery.eq('outcome', filters.outcome);
    if (filters.severity) actionsQuery = actionsQuery.eq('severity', filters.severity);
    if (filters.dateFrom) actionsQuery = actionsQuery.gte('timestamp', filters.dateFrom);
    if (filters.dateTo) actionsQuery = actionsQuery.lte('timestamp', filters.dateTo);
    const { data: actionData } = await actionsQuery.not('action', 'is', null);

    const actionCounts = actionData?.reduce((acc: Record<string, number>, row) => {
      acc[row.action] = (acc[row.action] || 0) + 1;
      return acc;
    }, {}) || {};

    const mostCommonActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalActions: totalActions || 0,
      successfulActions: successfulActions || 0,
      failedActions: failedActions || 0,
      criticalEvents: criticalEvents || 0,
      uniqueUsers,
      mostCommonActions,
    };
  } catch (error) {
    console.error('Error calculating summary stats:', error);
    // Return default values if calculation fails
    return {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      criticalEvents: 0,
      uniqueUsers: 0,
      mostCommonActions: [],
    };
  }
}