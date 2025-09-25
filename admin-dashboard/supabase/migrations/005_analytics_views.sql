-- Migration: 005_analytics_views.sql
-- Description: Create user_analytics materialized view for aggregated user metrics and analytics
-- Created: 2025-09-25

-- Create user_analytics materialized view
-- Note: This assumes the existence of main app tables (users, profiles, etc.)
-- The exact table structure may need to be adjusted based on the actual main app schema

CREATE MATERIALIZED VIEW public.user_analytics AS
WITH user_stats AS (
    SELECT
        DATE_TRUNC('day', u.created_at) as date,
        COUNT(*) as new_users,
        COUNT(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) as confirmed_users,
        COUNT(*) FILTER (WHERE p.completed_at IS NOT NULL) as completed_profiles,
        COUNT(DISTINCT u.id) FILTER (WHERE u.last_sign_in_at >= CURRENT_DATE - INTERVAL '7 days') as active_7_days,
        COUNT(DISTINCT u.id) FILTER (WHERE u.last_sign_in_at >= CURRENT_DATE - INTERVAL '30 days') as active_30_days,
        AVG(EXTRACT(EPOCH FROM (COALESCE(p.completed_at, NOW()) - u.created_at))) as avg_completion_time_seconds
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '365 days'
    GROUP BY DATE_TRUNC('day', u.created_at)
),
cumulative_stats AS (
    SELECT
        date,
        new_users,
        confirmed_users,
        completed_profiles,
        active_7_days,
        active_30_days,
        avg_completion_time_seconds,
        SUM(new_users) OVER (ORDER BY date) as total_users,
        SUM(confirmed_users) OVER (ORDER BY date) as total_confirmed_users,
        SUM(completed_profiles) OVER (ORDER BY date) as total_completed_profiles
    FROM user_stats
),
engagement_metrics AS (
    SELECT
        DATE_TRUNC('day', u.last_sign_in_at) as date,
        COUNT(DISTINCT u.id) as daily_active_users,
        COUNT(*) as total_sessions,
        AVG(EXTRACT(EPOCH FROM (u.updated_at - u.last_sign_in_at))) as avg_session_duration_seconds
    FROM auth.users u
    WHERE u.last_sign_in_at >= CURRENT_DATE - INTERVAL '365 days'
    AND u.last_sign_in_at IS NOT NULL
    GROUP BY DATE_TRUNC('day', u.last_sign_in_at)
),
retention_cohorts AS (
    SELECT
        DATE_TRUNC('month', u.created_at) as cohort_month,
        COUNT(*) as cohort_size,
        COUNT(*) FILTER (WHERE u.last_sign_in_at >= u.created_at + INTERVAL '7 days') as retained_7_days,
        COUNT(*) FILTER (WHERE u.last_sign_in_at >= u.created_at + INTERVAL '30 days') as retained_30_days,
        COUNT(*) FILTER (WHERE u.last_sign_in_at >= u.created_at + INTERVAL '90 days') as retained_90_days
    FROM auth.users u
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', u.created_at)
)
SELECT
    COALESCE(cs.date, em.date, rc.cohort_month) as date,
    cs.new_users,
    cs.confirmed_users,
    cs.completed_profiles,
    cs.total_users,
    cs.total_confirmed_users,
    cs.total_completed_profiles,
    cs.active_7_days,
    cs.active_30_days,
    cs.avg_completion_time_seconds,
    em.daily_active_users,
    em.total_sessions,
    em.avg_session_duration_seconds,
    rc.cohort_size,
    rc.retained_7_days,
    rc.retained_30_days,
    rc.retained_90_days,
    CASE WHEN rc.cohort_size > 0 THEN (rc.retained_7_days::FLOAT / rc.cohort_size * 100) END as retention_rate_7_days,
    CASE WHEN rc.cohort_size > 0 THEN (rc.retained_30_days::FLOAT / rc.cohort_size * 100) END as retention_rate_30_days,
    CASE WHEN rc.cohort_size > 0 THEN (rc.retained_90_days::FLOAT / rc.cohort_size * 100) END as retention_rate_90_days,
    NOW() as last_updated
FROM cumulative_stats cs
FULL OUTER JOIN engagement_metrics em ON cs.date = em.date
FULL OUTER JOIN retention_cohorts rc ON DATE_TRUNC('month', cs.date) = rc.cohort_month
ORDER BY COALESCE(cs.date, em.date, rc.cohort_month) DESC;

-- Create indexes on the materialized view
CREATE INDEX idx_user_analytics_date ON public.user_analytics(date);
CREATE INDEX idx_user_analytics_last_updated ON public.user_analytics(last_updated);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_user_analytics() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.user_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create user_growth_summary view for quick metrics
CREATE VIEW public.user_growth_summary AS
SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as users_last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_last_30_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '90 days') as users_last_90_days,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
    COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE - INTERVAL '7 days') as active_users_7_days,
    COUNT(*) FILTER (WHERE last_sign_in_at >= CURRENT_DATE - INTERVAL '30 days') as active_users_30_days,
    ROUND(
        COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL)::FLOAT /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as email_confirmation_rate,
    NOW() as calculated_at
FROM auth.users
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years';

-- Create daily_metrics view for dashboard widgets
CREATE VIEW public.daily_metrics AS
WITH today_stats AS (
    SELECT
        COUNT(*) as users_today,
        COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_today
    FROM auth.users
    WHERE DATE(created_at) = CURRENT_DATE
),
yesterday_stats AS (
    SELECT
        COUNT(*) as users_yesterday,
        COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_yesterday
    FROM auth.users
    WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
),
profile_stats AS (
    SELECT
        COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE) as profiles_completed_today,
        COUNT(*) FILTER (WHERE DATE(completed_at) = CURRENT_DATE - INTERVAL '1 day') as profiles_completed_yesterday
    FROM public.profiles
    WHERE completed_at IS NOT NULL
),
session_stats AS (
    SELECT
        COUNT(DISTINCT user_id) FILTER (WHERE DATE(last_sign_in_at) = CURRENT_DATE) as active_users_today,
        COUNT(DISTINCT user_id) FILTER (WHERE DATE(last_sign_in_at) = CURRENT_DATE - INTERVAL '1 day') as active_users_yesterday
    FROM auth.users
    WHERE last_sign_in_at IS NOT NULL
)
SELECT
    ts.users_today,
    ts.confirmed_today,
    ys.users_yesterday,
    ys.confirmed_yesterday,
    ps.profiles_completed_today,
    ps.profiles_completed_yesterday,
    ss.active_users_today,
    ss.active_users_yesterday,
    CASE
        WHEN ys.users_yesterday > 0 THEN
            ROUND(((ts.users_today - ys.users_yesterday)::FLOAT / ys.users_yesterday * 100), 2)
        ELSE 0
    END as users_change_percent,
    CASE
        WHEN ss.active_users_yesterday > 0 THEN
            ROUND(((ss.active_users_today - ss.active_users_yesterday)::FLOAT / ss.active_users_yesterday * 100), 2)
        ELSE 0
    END as active_users_change_percent,
    NOW() as calculated_at
FROM today_stats ts
CROSS JOIN yesterday_stats ys
CROSS JOIN profile_stats ps
CROSS JOIN session_stats ss;

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW public.user_analytics IS 'Aggregated user analytics including growth, engagement, and retention metrics';
COMMENT ON VIEW public.user_growth_summary IS 'Summary view of user growth metrics for dashboard widgets';
COMMENT ON VIEW public.daily_metrics IS 'Daily metrics comparison for real-time dashboard monitoring';

-- Enable Row Level Security for views
ALTER MATERIALIZED VIEW public.user_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_analytics
CREATE POLICY "Admin users can view user analytics" ON public.user_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Grant permissions to authenticated users (admin users will be filtered by RLS)
GRANT SELECT ON public.user_analytics TO authenticated;
GRANT SELECT ON public.user_growth_summary TO authenticated;
GRANT SELECT ON public.daily_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_analytics() TO authenticated;

-- Create a scheduled job to refresh the materialized view (if pg_cron is available)
-- This would typically be set up separately or via a cron job
-- SELECT cron.schedule('refresh-user-analytics', '0 */6 * * *', 'SELECT refresh_user_analytics();');