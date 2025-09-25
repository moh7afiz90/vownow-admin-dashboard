import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  status: 'success' | 'failed';
  error_message?: string;
}

class AuditLogger {
  private static instance: AuditLogger;
  private supabase: any;

  private constructor() {
    this.supabase = createClientComponentClient();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user if not provided
      if (!entry.user_id) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          entry.user_id = user.id;
          entry.user_email = user.email;
          entry.user_name = user.user_metadata?.name || user.email?.split('@')[0];
        }
      }

      // Add timestamp
      const logEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
      };

      // Insert into audit_logs table
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(logEntry);

      if (error) {
        console.error('Failed to write audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  }

  // Convenience methods for common actions
  async logLogin(metadata?: any): Promise<void> {
    await this.log({
      action: 'login',
      resource_type: 'auth',
      status: 'success',
      metadata,
    });
  }

  async logLogout(metadata?: any): Promise<void> {
    await this.log({
      action: 'logout',
      resource_type: 'auth',
      status: 'success',
      metadata,
    });
  }

  async logCreate(resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      status: 'success',
      metadata,
    });
  }

  async logUpdate(resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      status: 'success',
      metadata,
    });
  }

  async logDelete(resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      status: 'success',
      metadata,
    });
  }

  async logView(resourceType: string, resourceId: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'view',
      resource_type: resourceType,
      resource_id: resourceId,
      status: 'success',
      metadata,
    });
  }

  async logExport(resourceType: string, metadata?: any): Promise<void> {
    await this.log({
      action: 'export',
      resource_type: resourceType,
      status: 'success',
      metadata,
    });
  }

  async logError(action: string, resourceType: string, error: any, metadata?: any): Promise<void> {
    await this.log({
      action,
      resource_type: resourceType,
      status: 'failed',
      error_message: error.message || 'Unknown error',
      metadata: {
        ...metadata,
        error: error.toString(),
      },
    });
  }

  async logSettingsChange(settingCategory: string, changes: any): Promise<void> {
    await this.log({
      action: 'update',
      resource_type: 'settings',
      resource_id: settingCategory,
      status: 'success',
      metadata: { changes },
    });
  }

  async logModeration(action: string, contentId: string, reason?: string): Promise<void> {
    await this.log({
      action: `moderation_${action}`,
      resource_type: 'content',
      resource_id: contentId,
      status: 'success',
      metadata: { reason },
    });
  }

  async logUserAction(action: string, userId: string, metadata?: any): Promise<void> {
    await this.log({
      action,
      resource_type: 'user',
      resource_id: userId,
      status: 'success',
      metadata,
    });
  }

  async logReportGeneration(reportType: string, reportId: string, parameters?: any): Promise<void> {
    await this.log({
      action: 'generate',
      resource_type: 'report',
      resource_id: reportId,
      status: 'success',
      metadata: { reportType, parameters },
    });
  }
}

export const auditLogger = AuditLogger.getInstance();