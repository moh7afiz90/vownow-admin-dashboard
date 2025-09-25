/**
 * Database Types for Admin Dashboard
 * Generated from Supabase schema
 *
 * This file contains TypeScript type definitions for all database tables,
 * views, and functions used in the admin dashboard.
 */

// =====================================================
// ENUMS
// =====================================================

export type WidgetType =
  | 'metric_card'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'chart_area'
  | 'table'
  | 'list'
  | 'map'
  | 'text'
  | 'iframe'
  | 'custom';

export type AdminUserRole = 'super_admin' | 'admin' | 'analyst' | 'viewer';

export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed' | 'scheduled';

export type ReportTemplateType = 'analytics' | 'demographic' | 'conversion' | 'custom';

export type ReportExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

// =====================================================
// BASE TYPES
// =====================================================

export interface DatabaseTimestamps {
  created_at: string;
  updated_at: string;
}

export interface DatabaseBaseTable extends DatabaseTimestamps {
  id: string;
}

// =====================================================
// TABLE INTERFACES
// =====================================================

export interface AdminUser extends DatabaseBaseTable {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AdminUserRole;
  permissions: Record<string, any>;
  is_active: boolean;
  last_login_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface AuditLog extends DatabaseTimestamps {
  id: string;
  admin_user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface ReportTemplate extends DatabaseBaseTable {
  name: string;
  description: string | null;
  template_type: ReportTemplateType;
  configuration: Record<string, any>;
  sql_query: string | null;
  chart_config: Record<string, any>;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
}

export interface Report extends DatabaseBaseTable {
  template_id: string | null;
  name: string;
  description: string | null;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  data: Record<string, any> | null;
  status: ReportStatus;
  error_message: string | null;
  file_url: string | null;
  file_size: number | null;
  expires_at: string | null;
  is_public: boolean;
  access_token: string | null;
  download_count: number;
  last_downloaded_at: string | null;
  generated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface ReportSchedule extends DatabaseBaseTable {
  template_id: string;
  name: string;
  description: string | null;
  cron_expression: string;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  recipients: string[];
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  failure_count: number;
  last_error: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface ReportExecution extends DatabaseTimestamps {
  id: string;
  schedule_id: string | null;
  report_id: string | null;
  status: ReportExecutionStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  metadata: Record<string, any>;
}

export interface DashboardWidget extends DatabaseBaseTable {
  name: string;
  description: string | null;
  widget_type: WidgetType;
  category: string;
  configuration: Record<string, any>;
  data_source: Record<string, any>;
  layout: Record<string, any>;
  permissions: Record<string, any>;
  is_active: boolean;
  is_system: boolean;
  refresh_interval: number | null;
  last_refreshed_at: string | null;
  cache_duration: number;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
}

export interface UserWidgetPreferences extends DatabaseTimestamps {
  id: string;
  admin_user_id: string;
  widget_id: string;
  is_visible: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  custom_config: Record<string, any>;
}

export interface WidgetDataCache extends DatabaseTimestamps {
  id: string;
  widget_id: string;
  cache_key: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  expires_at: string;
}

// =====================================================
// VIEW INTERFACES (for analytics materialized views)
// =====================================================

export interface UserAnalytics {
  date: string;
  new_users: number | null;
  confirmed_users: number | null;
  completed_profiles: number | null;
  total_users: number | null;
  total_confirmed_users: number | null;
  total_completed_profiles: number | null;
  active_7_days: number | null;
  active_30_days: number | null;
  avg_completion_time_seconds: number | null;
  daily_active_users: number | null;
  total_sessions: number | null;
  avg_session_duration_seconds: number | null;
  cohort_size: number | null;
  retained_7_days: number | null;
  retained_30_days: number | null;
  retained_90_days: number | null;
  retention_rate_7_days: number | null;
  retention_rate_30_days: number | null;
  retention_rate_90_days: number | null;
  last_updated: string;
}

export interface UserGrowthSummary {
  total_users: number;
  users_last_7_days: number;
  users_last_30_days: number;
  users_last_90_days: number;
  confirmed_users: number;
  active_users_7_days: number;
  active_users_30_days: number;
  email_confirmation_rate: number;
  calculated_at: string;
}

export interface DailyMetrics {
  users_today: number;
  confirmed_today: number;
  users_yesterday: number;
  confirmed_yesterday: number;
  profiles_completed_today: number;
  profiles_completed_yesterday: number;
  active_users_today: number;
  active_users_yesterday: number;
  users_change_percent: number;
  active_users_change_percent: number;
  calculated_at: string;
}

export interface SurveyDemographics {
  category: string;
  value: string;
  count: number;
  percentage: number;
  month: string | null;
  completions: number | null;
  geo_location: string | null;
  geo_user_count: number | null;
  geo_male_count: number | null;
  geo_female_count: number | null;
  geo_other_gender_count: number | null;
  geo_avg_age: number | null;
  last_updated: string;
}

export interface DemographicOverview {
  total_completed_profiles: number;
  unique_genders: number;
  unique_locations: number;
  unique_education_levels: number;
  unique_income_ranges: number;
  average_age: number;
  completed_last_30_days: number;
  completed_last_7_days: number;
  gender_distribution: Record<string, number>;
  top_locations: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  calculated_at: string;
}

export interface AgeDistribution {
  age_group: string;
  total_count: number;
  percentage: number;
  male_count: number;
  female_count: number;
  other_count: number;
  calculated_at: string;
}

export interface ConversionFunnel {
  cohort_date: string;
  cohort_week: string;
  cohort_month: string;
  registration_count: number;
  email_confirmation_count: number;
  profile_started_count: number;
  profile_completed_count: number;
  first_interaction_count: number;
  active_user_count: number;
  email_confirmation_rate: number;
  profile_start_rate: number;
  profile_completion_rate: number;
  first_interaction_rate: number;
  activation_rate: number;
  overall_conversion_rate: number;
  avg_hours_to_email_confirm: number | null;
  avg_hours_to_profile_start: number | null;
  avg_hours_to_profile_complete: number | null;
  avg_hours_to_first_login: number | null;
  drop_off_step: string | null;
  dropped_users: number | null;
  drop_off_rate: number | null;
  last_updated: string;
}

export interface FunnelSummary {
  total_registrations: number;
  total_email_confirmations: number;
  total_profile_starts: number;
  total_profile_completions: number;
  total_first_interactions: number;
  total_active_users: number;
  overall_email_confirmation_rate: number;
  overall_profile_start_rate: number;
  overall_profile_completion_rate: number;
  overall_first_interaction_rate: number;
  overall_activation_rate: number;
  end_to_end_conversion_rate: number;
  calculated_at: string;
}

export interface DailyFunnelMetrics {
  registrations_today: number;
  confirmations_today: number;
  completions_today: number;
  email_confirmation_rate: number;
  profile_completion_rate: number;
  overall_conversion_rate: number;
  registrations_yesterday: number;
  confirmations_yesterday: number;
  completions_yesterday: number;
  registrations_change_percent: number;
  completion_rate_change_percent: number;
  calculated_at: string;
}

// =====================================================
// FUNCTION PARAMETER TYPES
// =====================================================

export interface LogAdminActionParams {
  p_admin_user_id: string;
  p_action: string;
  p_resource_type: string;
  p_resource_id?: string;
  p_old_values?: Record<string, any>;
  p_new_values?: Record<string, any>;
  p_metadata?: Record<string, any>;
  p_ip_address?: string;
  p_user_agent?: string;
  p_session_id?: string;
  p_success?: boolean;
  p_error_message?: string;
}

export interface GetUserWidgetLayoutParams {
  p_admin_user_id: string;
}

export interface UserWidgetLayout {
  widget_id: string;
  widget_name: string;
  widget_type: WidgetType;
  category: string;
  configuration: Record<string, any>;
  layout: Record<string, any>;
  is_visible: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  custom_config: Record<string, any>;
}

// =====================================================
// INDEX USAGE STATISTICS TYPES
// =====================================================

export interface IndexUsageStats {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_scans: number;
  tuples_read: number;
  tuples_fetched: number;
  index_size: string;
}

export interface UnusedIndex {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_size: string;
  table_size: string;
}

// =====================================================
// DATABASE SCHEMA TYPE
// =====================================================

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never; // Audit logs are immutable
      };
      report_templates: {
        Row: ReportTemplate;
        Insert: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Report, 'id' | 'created_at' | 'updated_at'>>;
      };
      report_schedules: {
        Row: ReportSchedule;
        Insert: Omit<ReportSchedule, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ReportSchedule, 'id' | 'created_at' | 'updated_at'>>;
      };
      report_executions: {
        Row: ReportExecution;
        Insert: Omit<ReportExecution, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ReportExecution, 'id' | 'created_at' | 'updated_at'>>;
      };
      dashboard_widgets: {
        Row: DashboardWidget;
        Insert: Omit<DashboardWidget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DashboardWidget, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_widget_preferences: {
        Row: UserWidgetPreferences;
        Insert: Omit<UserWidgetPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserWidgetPreferences, 'id' | 'created_at' | 'updated_at'>>;
      };
      widget_data_cache: {
        Row: WidgetDataCache;
        Insert: Omit<WidgetDataCache, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WidgetDataCache, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      user_analytics: {
        Row: UserAnalytics;
      };
      user_growth_summary: {
        Row: UserGrowthSummary;
      };
      daily_metrics: {
        Row: DailyMetrics;
      };
      survey_demographics: {
        Row: SurveyDemographics;
      };
      demographic_overview: {
        Row: DemographicOverview;
      };
      age_distribution: {
        Row: AgeDistribution;
      };
      conversion_funnel: {
        Row: ConversionFunnel;
      };
      funnel_summary: {
        Row: FunnelSummary;
      };
      daily_funnel_metrics: {
        Row: DailyFunnelMetrics;
      };
    };
    Functions: {
      log_admin_action: {
        Args: LogAdminActionParams;
        Returns: string;
      };
      get_user_widget_layout: {
        Args: GetUserWidgetLayoutParams;
        Returns: UserWidgetLayout[];
      };
      refresh_user_analytics: {
        Args: {};
        Returns: void;
      };
      refresh_survey_demographics: {
        Args: {};
        Returns: void;
      };
      refresh_conversion_funnel: {
        Args: {};
        Returns: void;
      };
      clean_expired_widget_cache: {
        Args: {};
        Returns: void;
      };
      generate_report_access_token: {
        Args: {};
        Returns: string;
      };
      get_index_usage_stats: {
        Args: {};
        Returns: IndexUsageStats[];
      };
      get_unused_indexes: {
        Args: {};
        Returns: UnusedIndex[];
      };
    };
  };
}

// =====================================================
// UTILITY TYPES FOR ADMIN DASHBOARD
// =====================================================

export type AdminRole = AdminUserRole;

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;

export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? U : never;

export type DbResultErr = { error: { message: string; details?: string; hint?: string } };

// Helper type for paginated results
export interface PaginatedResult<T> {
  data: T[];
  count: number | null;
  error: null;
}

// Helper type for widget configurations
export interface WidgetConfig {
  title?: string;
  description?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  refreshInterval?: number;
  [key: string]: any;
}

// Helper type for chart data
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  category?: string;
  [key: string]: any;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    [key: string]: any;
  }>;
}

// Helper types for filters and parameters
export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface DemographicFilter {
  age_groups?: string[];
  genders?: string[];
  locations?: string[];
  education_levels?: string[];
  income_ranges?: string[];
}

export interface ReportParameters {
  date_range?: DateRangeFilter;
  demographic_filters?: DemographicFilter;
  include_charts?: boolean;
  format?: 'pdf' | 'excel' | 'csv';
  [key: string]: any;
}

// Export the main Database type as default
export default Database;