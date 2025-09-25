-- Migration: seed.sql
-- Description: Seed data for development and testing of the admin dashboard
-- Created: 2025-09-25

-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================

-- Insert sample admin users
-- Note: These user_ids should correspond to actual auth.users entries
-- In a real setup, you would first create auth users, then reference their IDs

-- Sample admin users (you'll need to replace UUIDs with actual auth.users IDs)
INSERT INTO public.admin_users (
    id,
    user_id,
    email,
    full_name,
    role,
    permissions,
    is_active,
    last_login_at,
    created_by
) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- This should match an actual auth.users.id
    'admin@vownow.com',
    'Super Administrator',
    'super_admin',
    '{"can_manage_users": true, "can_manage_reports": true, "can_view_all_analytics": true}',
    true,
    NOW() - INTERVAL '1 hour',
    null
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'manager@vownow.com',
    'Dashboard Manager',
    'admin',
    '{"can_manage_reports": true, "can_view_all_analytics": true}',
    true,
    NOW() - INTERVAL '2 hours',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'analyst@vownow.com',
    'Data Analyst',
    'analyst',
    '{"can_view_analytics": true, "can_create_reports": true}',
    true,
    NOW() - INTERVAL '3 hours',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'viewer@vownow.com',
    'Dashboard Viewer',
    'viewer',
    '{"can_view_basic_analytics": true}',
    true,
    NOW() - INTERVAL '1 day',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
);

-- Insert sample audit logs
INSERT INTO public.audit_logs (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent,
    session_id,
    success,
    created_at
) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'LOGIN',
    'admin_session',
    null,
    null,
    '{"login_method": "email"}',
    '{"browser": "Chrome", "os": "macOS"}',
    '192.168.1.100',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'sess_abc123def456',
    true,
    NOW() - INTERVAL '1 hour'
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'CREATE',
    'report',
    'report_001',
    null,
    '{"name": "User Growth Report", "type": "analytics"}',
    '{"automated": false}',
    '192.168.1.101',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'sess_def456ghi789',
    true,
    NOW() - INTERVAL '2 hours'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'UPDATE',
    'dashboard_widget',
    'widget_001',
    '{"name": "User Count"}',
    '{"name": "Total Active Users"}',
    '{"reason": "clarity_improvement"}',
    '192.168.1.102',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'sess_ghi789jkl012',
    true,
    NOW() - INTERVAL '3 hours'
);

-- Insert sample report templates
INSERT INTO public.report_templates (
    id,
    name,
    description,
    template_type,
    configuration,
    sql_query,
    chart_config,
    is_active,
    created_by
) VALUES
(
    'template_analytics_001',
    'User Growth Analytics',
    'Comprehensive user growth report with retention metrics',
    'analytics',
    '{"time_range": "30d", "metrics": ["new_users", "retention", "engagement"]}',
    'SELECT date, new_users, total_users FROM user_analytics WHERE date >= $1 AND date <= $2',
    '{"type": "line", "colors": ["#3b82f6", "#10b981"], "showGrid": true}',
    true,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'template_demographic_001',
    'Demographics Overview',
    'User demographic breakdown and geographic distribution',
    'demographic',
    '{"include_age": true, "include_location": true, "include_gender": true}',
    'SELECT category, value, count, percentage FROM survey_demographics WHERE category = $1',
    '{"type": "pie", "colors": ["#f59e0b", "#ef4444", "#8b5cf6"], "showLegend": true}',
    true,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
),
(
    'template_conversion_001',
    'Conversion Funnel Analysis',
    'Step-by-step conversion tracking from registration to activation',
    'conversion',
    '{"steps": ["registration", "email_confirm", "profile_complete", "first_interaction"]}',
    'SELECT cohort_date, registration_count, email_confirmation_rate, profile_completion_rate FROM conversion_funnel',
    '{"type": "funnel", "colors": ["#059669", "#dc2626"], "showValues": true}',
    true,
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Insert sample reports
INSERT INTO public.reports (
    id,
    template_id,
    name,
    description,
    parameters,
    filters,
    status,
    is_public,
    download_count,
    created_by
) VALUES
(
    'report_001',
    'template_analytics_001',
    'Monthly User Growth - December 2024',
    'User growth analysis for December 2024',
    '{"start_date": "2024-12-01", "end_date": "2024-12-31"}',
    '{"exclude_test_users": true}',
    'completed',
    false,
    5,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
),
(
    'report_002',
    'template_demographic_001',
    'Q4 2024 Demographics Report',
    'Quarterly demographic analysis',
    '{"quarter": "Q4", "year": 2024}',
    '{}',
    'completed',
    true,
    12,
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Insert sample report schedules
INSERT INTO public.report_schedules (
    id,
    template_id,
    name,
    description,
    cron_expression,
    parameters,
    recipients,
    is_active,
    next_run_at,
    created_by
) VALUES
(
    'schedule_001',
    'template_analytics_001',
    'Weekly User Growth Report',
    'Automated weekly user growth analysis',
    '0 9 * * 1', -- Every Monday at 9 AM
    '{"time_range": "7d", "compare_previous": true}',
    '["admin@vownow.com", "manager@vownow.com"]',
    true,
    date_trunc('week', NOW()) + INTERVAL '1 week' + INTERVAL '9 hours',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'schedule_002',
    'template_demographic_001',
    'Monthly Demographics Summary',
    'Monthly demographic breakdown report',
    '0 10 1 * *', -- First day of month at 10 AM
    '{"include_trends": true}',
    '["analyst@vownow.com", "manager@vownow.com"]',
    true,
    date_trunc('month', NOW()) + INTERVAL '1 month' + INTERVAL '10 hours',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
);

-- Insert sample dashboard widgets
INSERT INTO public.dashboard_widgets (
    id,
    name,
    description,
    widget_type,
    category,
    configuration,
    data_source,
    layout,
    permissions,
    is_active,
    is_system,
    refresh_interval,
    sort_order,
    created_by
) VALUES
(
    'widget_total_users',
    'Total Users',
    'Total number of registered users',
    'metric_card',
    'overview',
    '{"color": "#3b82f6", "icon": "users", "format": "number"}',
    '{"type": "view", "name": "user_growth_summary", "field": "total_users"}',
    '{"x": 0, "y": 0, "width": 1, "height": 1}',
    '{"roles": ["super_admin", "admin", "analyst", "viewer"]}',
    true,
    true,
    300, -- 5 minutes
    1,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'widget_active_users',
    'Active Users (7d)',
    'Users active in the last 7 days',
    'metric_card',
    'overview',
    '{"color": "#10b981", "icon": "activity", "format": "number"}',
    '{"type": "view", "name": "user_growth_summary", "field": "active_users_7_days"}',
    '{"x": 1, "y": 0, "width": 1, "height": 1}',
    '{"roles": ["super_admin", "admin", "analyst", "viewer"]}',
    true,
    true,
    300,
    2,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'widget_conversion_rate',
    'Email Confirmation Rate',
    'Percentage of users who confirmed their email',
    'metric_card',
    'conversion',
    '{"color": "#f59e0b", "icon": "mail-check", "format": "percentage"}',
    '{"type": "view", "name": "user_growth_summary", "field": "email_confirmation_rate"}',
    '{"x": 2, "y": 0, "width": 1, "height": 1}',
    '{"roles": ["super_admin", "admin", "analyst"]}',
    true,
    true,
    300,
    3,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    'widget_user_growth_chart',
    'User Growth Trend',
    'Daily user registration trend over the last 30 days',
    'chart_line',
    'analytics',
    '{"colors": ["#3b82f6"], "showGrid": true, "showLegend": false}',
    '{"type": "view", "name": "user_analytics", "fields": ["date", "new_users"], "limit": 30}',
    '{"x": 0, "y": 1, "width": 2, "height": 2}',
    '{"roles": ["super_admin", "admin", "analyst"]}',
    true,
    false,
    600, -- 10 minutes
    4,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
),
(
    'widget_demographics_pie',
    'Gender Distribution',
    'User breakdown by gender',
    'chart_pie',
    'demographics',
    '{"colors": ["#8b5cf6", "#ec4899", "#06b6d4"], "showLegend": true}',
    '{"type": "view", "name": "demographic_overview", "field": "gender_distribution"}',
    '{"x": 2, "y": 1, "width": 1, "height": 2}',
    '{"roles": ["super_admin", "admin", "analyst"]}',
    true,
    false,
    1800, -- 30 minutes
    5,
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
);

-- Insert sample user widget preferences
INSERT INTO public.user_widget_preferences (
    admin_user_id,
    widget_id,
    is_visible,
    position_x,
    position_y,
    width,
    height,
    custom_config
) VALUES
-- Super admin sees all widgets in default layout
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'widget_total_users', true, 0, 0, 1, 1, '{}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'widget_active_users', true, 1, 0, 1, 1, '{}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'widget_conversion_rate', true, 2, 0, 1, 1, '{}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'widget_user_growth_chart', true, 0, 1, 2, 2, '{}'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'widget_demographics_pie', true, 2, 1, 1, 2, '{}'),
-- Manager has custom layout
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'widget_total_users', true, 0, 0, 1, 1, '{"title": "All Users"}'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'widget_active_users', true, 1, 0, 1, 1, '{}'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'widget_user_growth_chart', true, 0, 1, 3, 2, '{"showDataLabels": true}'),
-- Analyst focuses on analytics widgets
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'widget_total_users', true, 0, 0, 1, 1, '{}'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'widget_user_growth_chart', true, 1, 0, 2, 2, '{}'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'widget_demographics_pie', true, 0, 2, 1, 1, '{}'),
-- Viewer has minimal widgets
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'widget_total_users', true, 0, 0, 1, 1, '{}'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'widget_active_users', true, 1, 0, 1, 1, '{}');

-- Insert sample widget cache data
INSERT INTO public.widget_data_cache (
    widget_id,
    cache_key,
    data,
    metadata,
    expires_at
) VALUES
(
    'widget_total_users',
    'total_users_global',
    '{"value": 15847, "change": 234, "change_percent": 1.5}',
    '{"last_calculated": "2025-09-25T10:00:00Z", "calculation_time_ms": 45}',
    NOW() + INTERVAL '5 minutes'
),
(
    'widget_active_users',
    'active_users_7d_global',
    '{"value": 8920, "change": -120, "change_percent": -1.3}',
    '{"last_calculated": "2025-09-25T10:00:00Z", "calculation_time_ms": 67}',
    NOW() + INTERVAL '5 minutes'
),
(
    'widget_conversion_rate',
    'email_confirmation_rate_global',
    '{"value": 78.5, "change": 2.1, "change_percent": 2.7}',
    '{"last_calculated": "2025-09-25T10:00:00Z", "calculation_time_ms": 123}',
    NOW() + INTERVAL '5 minutes'
);

-- Insert sample report executions
INSERT INTO public.report_executions (
    schedule_id,
    report_id,
    status,
    started_at,
    completed_at,
    duration_ms,
    metadata
) VALUES
(
    'schedule_001',
    'report_001',
    'completed',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '2 minutes',
    120000, -- 2 minutes
    '{"rows_processed": 1500, "charts_generated": 3}'
),
(
    'schedule_002',
    'report_002',
    'completed',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '45 seconds',
    45000, -- 45 seconds
    '{"rows_processed": 500, "charts_generated": 2}'
);

-- =====================================================
-- REFRESH MATERIALIZED VIEWS WITH SAMPLE DATA
-- =====================================================

-- Note: These refreshes will fail if the underlying tables (auth.users, profiles) don't exist
-- In a real setup, you would have actual user data to populate these views

-- For development, you might want to create some mock data in the main app tables first
-- or comment out these refresh commands until real data is available

-- REFRESH MATERIALIZED VIEW public.user_analytics;
-- REFRESH MATERIALIZED VIEW public.survey_demographics;
-- REFRESH MATERIALIZED VIEW public.conversion_funnel;

-- =====================================================
-- GRANT PERMISSIONS FOR SEED DATA ACCESS
-- =====================================================

-- Ensure the seeded admin users can access their data
-- (RLS policies should handle this, but just to be sure)

-- Update statistics after inserting seed data
ANALYZE public.admin_users;
ANALYZE public.audit_logs;
ANALYZE public.report_templates;
ANALYZE public.reports;
ANALYZE public.report_schedules;
ANALYZE public.report_executions;
ANALYZE public.dashboard_widgets;
ANALYZE public.user_widget_preferences;
ANALYZE public.widget_data_cache;

-- =====================================================
-- DEVELOPMENT HELPER FUNCTIONS
-- =====================================================

-- Function to reset seed data (useful for development)
CREATE OR REPLACE FUNCTION reset_seed_data() RETURNS void AS $$
BEGIN
    -- Delete in reverse dependency order
    DELETE FROM public.widget_data_cache;
    DELETE FROM public.user_widget_preferences;
    DELETE FROM public.report_executions;
    DELETE FROM public.reports;
    DELETE FROM public.report_schedules;
    DELETE FROM public.report_templates;
    DELETE FROM public.dashboard_widgets;
    DELETE FROM public.audit_logs;
    DELETE FROM public.admin_users;

    RAISE NOTICE 'Seed data has been reset. Run the seed migration again to repopulate.';
END;
$$ LANGUAGE plpgsql;

-- Function to generate additional test audit logs
CREATE OR REPLACE FUNCTION generate_test_audit_logs(count_per_user INTEGER DEFAULT 10) RETURNS void AS $$
DECLARE
    admin_user RECORD;
    i INTEGER;
    actions TEXT[] := ARRAY['LOGIN', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'];
    resources TEXT[] := ARRAY['report', 'dashboard_widget', 'admin_user', 'report_schedule'];
BEGIN
    FOR admin_user IN SELECT id FROM public.admin_users WHERE is_active = true LOOP
        FOR i IN 1..count_per_user LOOP
            INSERT INTO public.audit_logs (
                admin_user_id,
                action,
                resource_type,
                resource_id,
                metadata,
                ip_address,
                success,
                created_at
            ) VALUES (
                admin_user.id,
                actions[floor(random() * array_length(actions, 1) + 1)],
                resources[floor(random() * array_length(resources, 1) + 1)],
                'resource_' || floor(random() * 1000 + 1),
                '{"generated": true, "test_data": true}',
                '192.168.1.' || floor(random() * 254 + 1),
                random() > 0.1, -- 90% success rate
                NOW() - (random() * INTERVAL '30 days')
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Generated % test audit logs for % users', count_per_user,
        (SELECT COUNT(*) FROM public.admin_users WHERE is_active = true);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for helper functions
GRANT EXECUTE ON FUNCTION reset_seed_data() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_test_audit_logs(INTEGER) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION reset_seed_data() IS 'Development helper function to reset all seed data';
COMMENT ON FUNCTION generate_test_audit_logs(INTEGER) IS 'Development helper function to generate additional test audit log entries';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Seed data has been successfully inserted!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Admin Users: 4 (Super Admin, Admin, Analyst, Viewer)';
    RAISE NOTICE 'Report Templates: 3 (Analytics, Demographics, Conversion)';
    RAISE NOTICE 'Dashboard Widgets: 5 (Metrics and Charts)';
    RAISE NOTICE 'Sample Reports: 2';
    RAISE NOTICE 'Report Schedules: 2';
    RAISE NOTICE 'Audit Logs: 3 initial entries';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions Available:';
    RAISE NOTICE '- reset_seed_data(): Reset all seed data';
    RAISE NOTICE '- generate_test_audit_logs(count): Generate test audit logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: You may need to replace the user_id values in admin_users';
    RAISE NOTICE 'with actual auth.users IDs from your Supabase project.';
    RAISE NOTICE '==============================================';
END $$;