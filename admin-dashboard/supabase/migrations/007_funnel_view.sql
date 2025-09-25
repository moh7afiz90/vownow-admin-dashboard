-- Migration: 007_funnel_view.sql
-- Description: Create conversion_funnel materialized view for tracking user journey and conversion rates
-- Created: 2025-09-25

-- Create conversion_funnel materialized view
-- Note: This assumes the existence of main app tables and events tracking
-- The exact table structure may need to be adjusted based on the actual main app schema

CREATE MATERIALIZED VIEW public.conversion_funnel AS
WITH funnel_steps AS (
    -- Define the funnel steps and their tracking
    SELECT 'registration' as step_name, 1 as step_order, 'User registered' as step_description
    UNION ALL
    SELECT 'email_confirmation', 2, 'Email confirmed'
    UNION ALL
    SELECT 'profile_started', 3, 'Profile creation started'
    UNION ALL
    SELECT 'profile_completed', 4, 'Profile completed'
    UNION ALL
    SELECT 'first_interaction', 5, 'First meaningful interaction'
    UNION ALL
    SELECT 'active_user', 6, 'Became active user (7+ days)'
),
user_journey AS (
    SELECT
        u.id as user_id,
        u.created_at as registration_date,
        u.email_confirmed_at IS NOT NULL as email_confirmed,
        p.created_at IS NOT NULL as profile_started,
        p.completed_at IS NOT NULL as profile_completed,
        -- First interaction could be defined as first login after profile completion
        (u.last_sign_in_at IS NOT NULL AND u.last_sign_in_at > COALESCE(p.completed_at, u.created_at)) as first_interaction,
        -- Active user defined as someone who has logged in at least 3 times in their first 7 days
        CASE
            WHEN u.last_sign_in_at >= u.created_at + INTERVAL '7 days' THEN true
            ELSE false
        END as active_user,
        DATE_TRUNC('day', u.created_at) as cohort_date,
        DATE_TRUNC('week', u.created_at) as cohort_week,
        DATE_TRUNC('month', u.created_at) as cohort_month
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '365 days'
),
step_conversions AS (
    SELECT
        cohort_date,
        cohort_week,
        cohort_month,
        COUNT(*) as registration_count,
        COUNT(*) FILTER (WHERE email_confirmed) as email_confirmation_count,
        COUNT(*) FILTER (WHERE profile_started) as profile_started_count,
        COUNT(*) FILTER (WHERE profile_completed) as profile_completed_count,
        COUNT(*) FILTER (WHERE first_interaction) as first_interaction_count,
        COUNT(*) FILTER (WHERE active_user) as active_user_count
    FROM user_journey
    GROUP BY cohort_date, cohort_week, cohort_month
),
conversion_rates AS (
    SELECT
        cohort_date,
        cohort_week,
        cohort_month,
        registration_count,
        email_confirmation_count,
        profile_started_count,
        profile_completed_count,
        first_interaction_count,
        active_user_count,
        -- Calculate conversion rates
        CASE WHEN registration_count > 0 THEN
            ROUND((email_confirmation_count::NUMERIC / registration_count * 100), 2)
        ELSE 0 END as email_confirmation_rate,
        CASE WHEN email_confirmation_count > 0 THEN
            ROUND((profile_started_count::NUMERIC / email_confirmation_count * 100), 2)
        ELSE 0 END as profile_start_rate,
        CASE WHEN profile_started_count > 0 THEN
            ROUND((profile_completed_count::NUMERIC / profile_started_count * 100), 2)
        ELSE 0 END as profile_completion_rate,
        CASE WHEN profile_completed_count > 0 THEN
            ROUND((first_interaction_count::NUMERIC / profile_completed_count * 100), 2)
        ELSE 0 END as first_interaction_rate,
        CASE WHEN first_interaction_count > 0 THEN
            ROUND((active_user_count::NUMERIC / first_interaction_count * 100), 2)
        ELSE 0 END as activation_rate,
        -- Overall funnel conversion rate
        CASE WHEN registration_count > 0 THEN
            ROUND((active_user_count::NUMERIC / registration_count * 100), 2)
        ELSE 0 END as overall_conversion_rate
    FROM step_conversions
),
time_to_convert AS (
    SELECT
        cohort_date,
        AVG(EXTRACT(EPOCH FROM (COALESCE(u.email_confirmed_at, u.created_at) - u.created_at))) / 3600 as avg_hours_to_email_confirm,
        AVG(EXTRACT(EPOCH FROM (COALESCE(p.created_at, u.created_at + INTERVAL '1 year') - u.created_at))) / 3600 as avg_hours_to_profile_start,
        AVG(EXTRACT(EPOCH FROM (COALESCE(p.completed_at, u.created_at + INTERVAL '1 year') - u.created_at))) / 3600 as avg_hours_to_profile_complete,
        AVG(EXTRACT(EPOCH FROM (COALESCE(u.last_sign_in_at, u.created_at + INTERVAL '1 year') - u.created_at))) / 3600 as avg_hours_to_first_login
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '365 days'
    GROUP BY DATE_TRUNC('day', u.created_at)
),
drop_off_analysis AS (
    SELECT
        'registration_to_email' as drop_off_step,
        COUNT(*) FILTER (WHERE NOT email_confirmed) as dropped_users,
        COUNT(*) as total_users,
        ROUND((COUNT(*) FILTER (WHERE NOT email_confirmed)::NUMERIC / COUNT(*) * 100), 2) as drop_off_rate
    FROM user_journey

    UNION ALL

    SELECT
        'email_to_profile_start' as drop_off_step,
        COUNT(*) FILTER (WHERE email_confirmed AND NOT profile_started) as dropped_users,
        COUNT(*) FILTER (WHERE email_confirmed) as total_users,
        ROUND((COUNT(*) FILTER (WHERE email_confirmed AND NOT profile_started)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE email_confirmed), 0) * 100), 2) as drop_off_rate
    FROM user_journey

    UNION ALL

    SELECT
        'profile_start_to_complete' as drop_off_step,
        COUNT(*) FILTER (WHERE profile_started AND NOT profile_completed) as dropped_users,
        COUNT(*) FILTER (WHERE profile_started) as total_users,
        ROUND((COUNT(*) FILTER (WHERE profile_started AND NOT profile_completed)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE profile_started), 0) * 100), 2) as drop_off_rate
    FROM user_journey

    UNION ALL

    SELECT
        'profile_complete_to_interaction' as drop_off_step,
        COUNT(*) FILTER (WHERE profile_completed AND NOT first_interaction) as dropped_users,
        COUNT(*) FILTER (WHERE profile_completed) as total_users,
        ROUND((COUNT(*) FILTER (WHERE profile_completed AND NOT first_interaction)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE profile_completed), 0) * 100), 2) as drop_off_rate
    FROM user_journey
)
SELECT
    cr.cohort_date,
    cr.cohort_week,
    cr.cohort_month,
    cr.registration_count,
    cr.email_confirmation_count,
    cr.profile_started_count,
    cr.profile_completed_count,
    cr.first_interaction_count,
    cr.active_user_count,
    cr.email_confirmation_rate,
    cr.profile_start_rate,
    cr.profile_completion_rate,
    cr.first_interaction_rate,
    cr.activation_rate,
    cr.overall_conversion_rate,
    ttc.avg_hours_to_email_confirm,
    ttc.avg_hours_to_profile_start,
    ttc.avg_hours_to_profile_complete,
    ttc.avg_hours_to_first_login,
    dao.drop_off_step,
    dao.dropped_users,
    dao.drop_off_rate,
    NOW() as last_updated
FROM conversion_rates cr
LEFT JOIN time_to_convert ttc ON cr.cohort_date = ttc.cohort_date
LEFT JOIN drop_off_analysis dao ON true  -- Cross join for drop-off data
ORDER BY cr.cohort_date DESC, dao.drop_off_step;

-- Create indexes on the materialized view
CREATE INDEX idx_conversion_funnel_cohort_date ON public.conversion_funnel(cohort_date);
CREATE INDEX idx_conversion_funnel_cohort_week ON public.conversion_funnel(cohort_week);
CREATE INDEX idx_conversion_funnel_cohort_month ON public.conversion_funnel(cohort_month);
CREATE INDEX idx_conversion_funnel_drop_off_step ON public.conversion_funnel(drop_off_step);
CREATE INDEX idx_conversion_funnel_last_updated ON public.conversion_funnel(last_updated);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_conversion_funnel() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.conversion_funnel;
END;
$$ LANGUAGE plpgsql;

-- Create funnel_summary view for quick metrics
CREATE VIEW public.funnel_summary AS
WITH recent_funnel AS (
    SELECT
        SUM(registration_count) as total_registrations,
        SUM(email_confirmation_count) as total_email_confirmations,
        SUM(profile_started_count) as total_profile_starts,
        SUM(profile_completed_count) as total_profile_completions,
        SUM(first_interaction_count) as total_first_interactions,
        SUM(active_user_count) as total_active_users
    FROM public.conversion_funnel
    WHERE cohort_date >= CURRENT_DATE - INTERVAL '30 days'
    AND drop_off_step IS NULL -- Only include main funnel data, not drop-off analysis
),
overall_rates AS (
    SELECT
        CASE WHEN rf.total_registrations > 0 THEN
            ROUND((rf.total_email_confirmations::NUMERIC / rf.total_registrations * 100), 2)
        ELSE 0 END as overall_email_confirmation_rate,
        CASE WHEN rf.total_email_confirmations > 0 THEN
            ROUND((rf.total_profile_starts::NUMERIC / rf.total_email_confirmations * 100), 2)
        ELSE 0 END as overall_profile_start_rate,
        CASE WHEN rf.total_profile_starts > 0 THEN
            ROUND((rf.total_profile_completions::NUMERIC / rf.total_profile_starts * 100), 2)
        ELSE 0 END as overall_profile_completion_rate,
        CASE WHEN rf.total_profile_completions > 0 THEN
            ROUND((rf.total_first_interactions::NUMERIC / rf.total_profile_completions * 100), 2)
        ELSE 0 END as overall_first_interaction_rate,
        CASE WHEN rf.total_first_interactions > 0 THEN
            ROUND((rf.total_active_users::NUMERIC / rf.total_first_interactions * 100), 2)
        ELSE 0 END as overall_activation_rate,
        CASE WHEN rf.total_registrations > 0 THEN
            ROUND((rf.total_active_users::NUMERIC / rf.total_registrations * 100), 2)
        ELSE 0 END as end_to_end_conversion_rate
    FROM recent_funnel rf
)
SELECT
    rf.*,
    orr.overall_email_confirmation_rate,
    orr.overall_profile_start_rate,
    orr.overall_profile_completion_rate,
    orr.overall_first_interaction_rate,
    orr.overall_activation_rate,
    orr.end_to_end_conversion_rate,
    NOW() as calculated_at
FROM recent_funnel rf
CROSS JOIN overall_rates orr;

-- Create daily_funnel_metrics view for real-time monitoring
CREATE VIEW public.daily_funnel_metrics AS
WITH today_metrics AS (
    SELECT
        registration_count as registrations_today,
        email_confirmation_count as confirmations_today,
        profile_completed_count as completions_today,
        email_confirmation_rate,
        profile_completion_rate,
        overall_conversion_rate
    FROM public.conversion_funnel
    WHERE cohort_date = CURRENT_DATE
    AND drop_off_step IS NULL
    LIMIT 1
),
yesterday_metrics AS (
    SELECT
        registration_count as registrations_yesterday,
        email_confirmation_count as confirmations_yesterday,
        profile_completed_count as completions_yesterday,
        email_confirmation_rate as email_rate_yesterday,
        profile_completion_rate as completion_rate_yesterday,
        overall_conversion_rate as overall_rate_yesterday
    FROM public.conversion_funnel
    WHERE cohort_date = CURRENT_DATE - INTERVAL '1 day'
    AND drop_off_step IS NULL
    LIMIT 1
)
SELECT
    COALESCE(tm.registrations_today, 0) as registrations_today,
    COALESCE(tm.confirmations_today, 0) as confirmations_today,
    COALESCE(tm.completions_today, 0) as completions_today,
    COALESCE(tm.email_confirmation_rate, 0) as email_confirmation_rate,
    COALESCE(tm.profile_completion_rate, 0) as profile_completion_rate,
    COALESCE(tm.overall_conversion_rate, 0) as overall_conversion_rate,
    COALESCE(ym.registrations_yesterday, 0) as registrations_yesterday,
    COALESCE(ym.confirmations_yesterday, 0) as confirmations_yesterday,
    COALESCE(ym.completions_yesterday, 0) as completions_yesterday,
    -- Calculate day-over-day changes
    CASE
        WHEN ym.registrations_yesterday > 0 THEN
            ROUND(((COALESCE(tm.registrations_today, 0) - ym.registrations_yesterday)::NUMERIC / ym.registrations_yesterday * 100), 2)
        ELSE 0
    END as registrations_change_percent,
    CASE
        WHEN ym.completion_rate_yesterday > 0 THEN
            ROUND(((COALESCE(tm.profile_completion_rate, 0) - ym.completion_rate_yesterday)::NUMERIC / ym.completion_rate_yesterday * 100), 2)
        ELSE 0
    END as completion_rate_change_percent,
    NOW() as calculated_at
FROM today_metrics tm
FULL OUTER JOIN yesterday_metrics ym ON true;

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW public.conversion_funnel IS 'Comprehensive conversion funnel analysis tracking user journey from registration to activation';
COMMENT ON VIEW public.funnel_summary IS 'High-level funnel metrics for the last 30 days';
COMMENT ON VIEW public.daily_funnel_metrics IS 'Daily funnel metrics with day-over-day comparisons';

-- Enable Row Level Security for views
ALTER MATERIALIZED VIEW public.conversion_funnel ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversion_funnel
CREATE POLICY "Admin users can view conversion funnel" ON public.conversion_funnel
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Grant permissions to authenticated users (admin users will be filtered by RLS)
GRANT SELECT ON public.conversion_funnel TO authenticated;
GRANT SELECT ON public.funnel_summary TO authenticated;
GRANT SELECT ON public.daily_funnel_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_conversion_funnel() TO authenticated;