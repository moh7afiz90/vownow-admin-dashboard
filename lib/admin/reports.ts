import { supabase } from '@/lib/supabase';

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'analytics' | 'users' | 'surveys' | 'financial' | 'system';
  status: 'active' | 'inactive' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  scheduleConfig: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  } | null;
  parameters: Record<string, any>;
  createdBy: string;
  isPublic: boolean;
  downloadCount: number;
  averageRunTime: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: PaginationInfo;
  filters: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface CreateReportRequest {
  name: string;
  description: string;
  type: 'analytics' | 'users' | 'surveys' | 'financial' | 'system';
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time?: string;
  };
  parameters?: Record<string, any>;
  isPublic?: boolean;
}

export interface CreateReportResult {
  success?: boolean;
  report?: Report;
  error?: string;
}

export interface ValidateScheduleResult {
  isValid: boolean;
  errors?: string[];
}

interface ReportsFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchReports(filters: ReportsFilters = {}): Promise<ReportsListResponse> {
  try {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reports')
      .select(`
        id,
        name,
        description,
        type,
        status,
        created_at,
        updated_at,
        last_run_at,
        next_run_at,
        schedule_config,
        parameters,
        created_by,
        is_public,
        download_count,
        average_run_time
      `, { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'updated_at';
    const sortOrder = filters.sortOrder === 'asc' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply pagination
    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const reports: Report[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastRunAt: row.last_run_at,
      nextRunAt: row.next_run_at,
      scheduleConfig: row.schedule_config,
      parameters: row.parameters || {},
      createdBy: row.created_by,
      isPublic: row.is_public || false,
      downloadCount: row.download_count || 0,
      averageRunTime: row.average_run_time || 0,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        status: filters.status,
        type: filters.type,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function createReport(
  requestData: CreateReportRequest,
  createdBy: string
): Promise<CreateReportResult> {
  try {
    // Check for duplicate name
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('name', requestData.name)
      .single();

    if (existingReport) {
      return { error: 'Report with this name already exists' };
    }

    // Calculate next run time
    let nextRunAt: string | null = null;
    if (requestData.scheduleConfig) {
      nextRunAt = calculateNextRunTime(requestData.scheduleConfig);
    }

    const reportData = {
      name: requestData.name,
      description: requestData.description,
      type: requestData.type,
      status: requestData.scheduleConfig ? 'scheduled' : 'inactive',
      schedule_config: requestData.scheduleConfig,
      parameters: requestData.parameters || {},
      created_by: createdBy,
      is_public: requestData.isPublic || false,
      next_run_at: nextRunAt,
      download_count: 0,
      average_run_time: 0,
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const createdReport: Report = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRunAt: data.last_run_at,
      nextRunAt: data.next_run_at,
      scheduleConfig: data.schedule_config,
      parameters: data.parameters || {},
      createdBy: data.created_by,
      isPublic: data.is_public || false,
      downloadCount: data.download_count || 0,
      averageRunTime: data.average_run_time || 0,
    };

    return { success: true, report: createdReport };
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
}

export async function validateReportConfig(
  scheduleConfig?: CreateReportRequest['scheduleConfig']
): Promise<ValidateScheduleResult> {
  if (!scheduleConfig) {
    return { isValid: true };
  }

  const errors: string[] = [];
  const validFrequencies = ['daily', 'weekly', 'monthly', 'custom'];

  if (!validFrequencies.includes(scheduleConfig.frequency)) {
    errors.push('Invalid frequency');
  }

  if (scheduleConfig.frequency === 'weekly') {
    if (scheduleConfig.dayOfWeek === undefined) {
      errors.push('Day of week is required for weekly frequency');
    } else if (scheduleConfig.dayOfWeek < 0 || scheduleConfig.dayOfWeek > 6) {
      errors.push('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }
  }

  if (scheduleConfig.frequency === 'monthly') {
    if (scheduleConfig.dayOfMonth === undefined) {
      errors.push('Day of month is required for monthly frequency');
    } else if (scheduleConfig.dayOfMonth < 1 || scheduleConfig.dayOfMonth > 31) {
      errors.push('Day of month must be between 1 and 31');
    }
  }

  if (scheduleConfig.frequency === 'custom') {
    if (scheduleConfig.interval === undefined) {
      errors.push('Interval is required for custom frequency');
    } else if (scheduleConfig.interval < 1) {
      errors.push('Interval must be at least 1');
    }
  }

  if (scheduleConfig.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(scheduleConfig.time)) {
    errors.push('Time must be in HH:MM format');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function runReport(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock implementation - in real app would execute the report
    const { error } = await supabase
      .from('reports')
      .update({
        last_run_at: new Date().toISOString(),
        download_count: supabase.raw('download_count + 1'),
      })
      .eq('id', reportId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error running report:', error);
    return { success: false, error: 'Failed to run report' };
  }
}

export async function exportReport(
  reportId: string,
  format: 'csv' | 'pdf' | 'excel'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Mock implementation - in real app would generate the export
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !report) {
      return { success: false, error: 'Report not found' };
    }

    // Mock export URL
    const mockUrl = `https://storage.example.com/exports/${reportId}.${format}`;

    // Update download count
    await supabase
      .from('reports')
      .update({ download_count: supabase.raw('download_count + 1') })
      .eq('id', reportId);

    return { success: true, url: mockUrl };
  } catch (error) {
    console.error('Error exporting report:', error);
    return { success: false, error: 'Failed to export report' };
  }
}

function calculateNextRunTime(scheduleConfig: NonNullable<CreateReportRequest['scheduleConfig']>): string {
  const now = new Date();
  const nextRun = new Date(now);

  // Extract time if provided
  if (scheduleConfig.time) {
    const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  switch (scheduleConfig.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      if (scheduleConfig.dayOfWeek !== undefined) {
        const daysUntilNext = (scheduleConfig.dayOfWeek - nextRun.getDay() + 7) % 7;
        if (daysUntilNext === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilNext);
        }
      }
      break;

    case 'monthly':
      if (scheduleConfig.dayOfMonth !== undefined) {
        nextRun.setDate(scheduleConfig.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;

    case 'custom':
      if (scheduleConfig.interval) {
        nextRun.setDate(nextRun.getDate() + scheduleConfig.interval);
      }
      break;
  }

  return nextRun.toISOString();
}