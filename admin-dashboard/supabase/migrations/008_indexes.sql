-- Migration: 008_indexes.sql
-- Description: Create performance indexes for all tables and views
-- Created: 2025-09-25

-- =====================================================
-- INDEXES FOR MAIN APP TABLES (auth.users, profiles, etc.)
-- These indexes support the analytics views and improve query performance
-- =====================================================

-- Indexes on auth.users for analytics queries
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON auth.users(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_users_email_confirmed_at ON auth.users(email_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_auth_users_last_sign_in_at ON auth.users(last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at_confirmed ON auth.users(created_at, email_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_last_signin ON auth.users(created_at, last_sign_in_at);

-- Composite index for active user queries
CREATE INDEX IF NOT EXISTS idx_auth_users_active_analysis ON auth.users(last_sign_in_at, created_at)
    WHERE last_sign_in_at IS NOT NULL;

-- Indexes on profiles table for demographic analysis
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_completed_at ON public.profiles(completed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_education_level ON public.profiles(education_level) WHERE education_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_income_range ON public.profiles(income_range) WHERE income_range IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_relationship_status ON public.profiles(relationship_status) WHERE relationship_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_employment_status ON public.profiles(employment_status) WHERE employment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON public.profiles(date_of_birth) WHERE date_of_birth IS NOT NULL;

-- Composite indexes for demographic analysis
CREATE INDEX IF NOT EXISTS idx_profiles_completed_demographics ON public.profiles(completed_at, gender, location)
    WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_age_gender ON public.profiles(date_of_birth, gender, completed_at)
    WHERE date_of_birth IS NOT NULL AND completed_at IS NOT NULL;

-- Indexes for temporal analysis
CREATE INDEX IF NOT EXISTS idx_profiles_completed_month ON public.profiles(date_trunc('month', completed_at))
    WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_month ON public.profiles(date_trunc('month', created_at));

-- =====================================================
-- ADDITIONAL PERFORMANCE INDEXES FOR ADMIN TABLES
-- =====================================================

-- Additional indexes for audit_logs (beyond what was created in 002_audit_logs.sql)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource ON public.audit_logs(action, resource_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(admin_user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_success ON public.audit_logs(resource_type, success, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON public.audit_logs(session_id, created_at)
    WHERE session_id IS NOT NULL;

-- Partial indexes for failed actions (for error monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_logs_failures ON public.audit_logs(created_at, action, error_message)
    WHERE success = false;

-- Index for IP-based analysis
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address, created_at)
    WHERE ip_address IS NOT NULL;

-- Additional indexes for reports tables
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at_status ON public.reports(expires_at, status)
    WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_public_token ON public.reports(is_public, access_token)
    WHERE is_public = true AND access_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_download_stats ON public.reports(download_count, last_downloaded_at)
    WHERE download_count > 0;

-- Indexes for report schedules
CREATE INDEX IF NOT EXISTS idx_report_schedules_active_next_run ON public.report_schedules(is_active, next_run_at)
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_failure_monitoring ON public.report_schedules(failure_count, last_error, last_run_at)
    WHERE failure_count > 0;

-- Indexes for report executions
CREATE INDEX IF NOT EXISTS idx_report_executions_status_started ON public.report_executions(status, started_at);
CREATE INDEX IF NOT EXISTS idx_report_executions_duration ON public.report_executions(duration_ms, completed_at)
    WHERE completed_at IS NOT NULL;

-- Additional indexes for dashboard widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active_category ON public.dashboard_widgets(is_active, category, sort_order)
    WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_refresh_due ON public.dashboard_widgets(refresh_interval, last_refreshed_at)
    WHERE refresh_interval IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_permissions ON public.dashboard_widgets USING GIN (permissions)
    WHERE permissions != '{}';

-- Indexes for user widget preferences (performance for dashboard loading)
CREATE INDEX IF NOT EXISTS idx_user_widget_preferences_visible ON public.user_widget_preferences(admin_user_id, is_visible, position_x, position_y)
    WHERE is_visible = true;

-- Indexes for widget cache (cleanup and retrieval)
CREATE INDEX IF NOT EXISTS idx_widget_cache_expires_cleanup ON public.widget_data_cache(expires_at)
    WHERE expires_at < NOW() + INTERVAL '1 hour';
CREATE INDEX IF NOT EXISTS idx_widget_cache_created_at ON public.widget_data_cache(created_at);

-- =====================================================
-- INDEXES FOR MATERIALIZED VIEWS REFRESH PERFORMANCE
-- =====================================================

-- Indexes to support materialized view refreshes efficiently
-- These help the underlying queries that populate the materialized views

-- For user_analytics materialized view refresh
CREATE INDEX IF NOT EXISTS idx_users_analytics_refresh ON auth.users(created_at, email_confirmed_at, last_sign_in_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_profiles_analytics_refresh ON public.profiles(user_id, completed_at, created_at);

-- For survey_demographics materialized view refresh
CREATE INDEX IF NOT EXISTS idx_profiles_demographics_refresh ON public.profiles(completed_at, date_of_birth, gender, location, education_level, income_range);

-- For conversion_funnel materialized view refresh
CREATE INDEX IF NOT EXISTS idx_users_funnel_refresh ON auth.users(id, created_at, email_confirmed_at, last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_profiles_funnel_refresh ON public.profiles(user_id, created_at, completed_at);

-- =====================================================
-- TEXT SEARCH INDEXES (if full-text search is needed)
-- =====================================================

-- Full-text search on admin users (for user management interface)
CREATE INDEX IF NOT EXISTS idx_admin_users_search ON public.admin_users USING GIN (
    to_tsvector('english', COALESCE(full_name, '') || ' ' || COALESCE(email, ''))
);

-- Full-text search on audit logs (for log analysis)
CREATE INDEX IF NOT EXISTS idx_audit_logs_search ON public.audit_logs USING GIN (
    to_tsvector('english', COALESCE(action, '') || ' ' || COALESCE(resource_type, '') || ' ' || COALESCE(error_message, ''))
) WHERE error_message IS NOT NULL OR metadata != '{}';

-- Full-text search on reports
CREATE INDEX IF NOT EXISTS idx_reports_search ON public.reports USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- Full-text search on report templates
CREATE INDEX IF NOT EXISTS idx_report_templates_search ON public.report_templates USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- Full-text search on dashboard widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_search ON public.dashboard_widgets USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, ''))
);

-- =====================================================
-- PARTIAL INDEXES FOR COMMON FILTERED QUERIES
-- =====================================================

-- Active admin users (most common query)
CREATE INDEX IF NOT EXISTS idx_admin_users_active_role ON public.admin_users(role, created_at, last_login_at)
    WHERE is_active = true;

-- Recent audit logs (for real-time monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(created_at DESC, admin_user_id, action)
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Active report schedules due for execution
CREATE INDEX IF NOT EXISTS idx_report_schedules_due ON public.report_schedules(next_run_at, template_id)
    WHERE is_active = true AND next_run_at <= NOW() + INTERVAL '1 hour';

-- Running report executions (for monitoring)
CREATE INDEX IF NOT EXISTS idx_report_executions_running ON public.report_executions(started_at, schedule_id)
    WHERE status = 'running';

-- Non-expired reports (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_reports_cleanup ON public.reports(expires_at, file_url, created_at)
    WHERE expires_at IS NOT NULL AND expires_at > NOW();

-- Recently completed profiles (for real-time dashboards)
CREATE INDEX IF NOT EXISTS idx_profiles_recent_completions ON public.profiles(completed_at DESC, user_id, gender, location)
    WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days';

-- =====================================================
-- STATISTICS UPDATE
-- =====================================================

-- Update table statistics to help query planner
ANALYZE public.admin_users;
ANALYZE public.audit_logs;
ANALYZE public.report_templates;
ANALYZE public.reports;
ANALYZE public.report_schedules;
ANALYZE public.report_executions;
ANALYZE public.dashboard_widgets;
ANALYZE public.user_widget_preferences;
ANALYZE public.widget_data_cache;

-- Analyze main app tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        EXECUTE 'ANALYZE public.profiles';
    END IF;
END $$;

-- =====================================================
-- INDEX MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        pg_size_pretty(pg_relation_size(i.indexrelid))
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname IN ('public')
    ORDER BY s.idx_scan DESC, s.idx_tup_read DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    table_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid)),
        pg_size_pretty(pg_relation_size(s.relid))
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.idx_scan = 0
    AND s.schemaname IN ('public')
    AND NOT i.indisunique  -- Don't include unique indexes
    ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unused_indexes() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_index_usage_stats() IS 'Returns index usage statistics to help identify performance patterns';
COMMENT ON FUNCTION get_unused_indexes() IS 'Identifies indexes that are not being used and may be candidates for removal';