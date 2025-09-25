-- Migration: 006_demographics_view.sql
-- Description: Create survey_demographics materialized view for demographic analysis and reporting
-- Created: 2025-09-25

-- Create survey_demographics materialized view
-- Note: This assumes the existence of survey/profile tables from the main app
-- The exact table structure may need to be adjusted based on the actual main app schema

CREATE MATERIALIZED VIEW public.survey_demographics AS
WITH age_groups AS (
    SELECT
        CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 18 THEN 'Under 18'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 24 THEN '18-24'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 45 AND 54 THEN '45-54'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 55 AND 64 THEN '55-64'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) >= 65 THEN '65+'
            ELSE 'Unknown'
        END as age_group,
        p.gender,
        p.location,
        p.education_level,
        p.income_range,
        p.relationship_status,
        p.employment_status,
        p.ethnicity,
        p.languages_spoken,
        p.interests,
        p.lifestyle_preferences,
        p.completed_at,
        p.created_at,
        u.id as user_id
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.completed_at IS NOT NULL
),
demographic_summary AS (
    SELECT
        'age_group' as category,
        age_group as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    WHERE age_group != 'Unknown'
    GROUP BY age_group

    UNION ALL

    SELECT
        'gender' as category,
        COALESCE(gender, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY gender

    UNION ALL

    SELECT
        'education_level' as category,
        COALESCE(education_level, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY education_level

    UNION ALL

    SELECT
        'income_range' as category,
        COALESCE(income_range, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY income_range

    UNION ALL

    SELECT
        'relationship_status' as category,
        COALESCE(relationship_status, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY relationship_status

    UNION ALL

    SELECT
        'employment_status' as category,
        COALESCE(employment_status, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY employment_status

    UNION ALL

    SELECT
        'location' as category,
        COALESCE(location, 'Not specified') as value,
        COUNT(*) as count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
    FROM age_groups
    GROUP BY location
),
temporal_trends AS (
    SELECT
        DATE_TRUNC('month', completed_at) as month,
        age_group,
        gender,
        location,
        COUNT(*) as completions
    FROM age_groups
    WHERE completed_at >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', completed_at), age_group, gender, location
),
geographic_distribution AS (
    SELECT
        COALESCE(location, 'Unknown') as location,
        COUNT(*) as user_count,
        ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage,
        COUNT(*) FILTER (WHERE gender = 'Male') as male_count,
        COUNT(*) FILTER (WHERE gender = 'Female') as female_count,
        COUNT(*) FILTER (WHERE gender NOT IN ('Male', 'Female') OR gender IS NULL) as other_gender_count,
        ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE,
            CASE
                WHEN age_group = '18-24' THEN CURRENT_DATE - INTERVAL '21 years'
                WHEN age_group = '25-34' THEN CURRENT_DATE - INTERVAL '29 years'
                WHEN age_group = '35-44' THEN CURRENT_DATE - INTERVAL '39 years'
                WHEN age_group = '45-54' THEN CURRENT_DATE - INTERVAL '49 years'
                WHEN age_group = '55-64' THEN CURRENT_DATE - INTERVAL '59 years'
                WHEN age_group = '65+' THEN CURRENT_DATE - INTERVAL '70 years'
                ELSE CURRENT_DATE - INTERVAL '30 years'
            END
        ))), 1) as avg_estimated_age
    FROM age_groups
    GROUP BY location
)
SELECT
    ds.category,
    ds.value,
    ds.count,
    ds.percentage,
    tt.month,
    tt.completions,
    gd.location as geo_location,
    gd.user_count as geo_user_count,
    gd.male_count as geo_male_count,
    gd.female_count as geo_female_count,
    gd.other_gender_count as geo_other_gender_count,
    gd.avg_estimated_age as geo_avg_age,
    NOW() as last_updated
FROM demographic_summary ds
LEFT JOIN temporal_trends tt ON (
    (ds.category = 'age_group' AND ds.value = tt.age_group) OR
    (ds.category = 'gender' AND ds.value = tt.gender) OR
    (ds.category = 'location' AND ds.value = tt.location)
)
LEFT JOIN geographic_distribution gd ON ds.category = 'location' AND ds.value = gd.location
ORDER BY ds.category, ds.count DESC;

-- Create indexes on the materialized view
CREATE INDEX idx_survey_demographics_category ON public.survey_demographics(category);
CREATE INDEX idx_survey_demographics_value ON public.survey_demographics(value);
CREATE INDEX idx_survey_demographics_month ON public.survey_demographics(month);
CREATE INDEX idx_survey_demographics_last_updated ON public.survey_demographics(last_updated);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_survey_demographics() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.survey_demographics;
END;
$$ LANGUAGE plpgsql;

-- Create demographic_overview view for quick stats
CREATE VIEW public.demographic_overview AS
WITH profile_stats AS (
    SELECT
        COUNT(*) as total_completed_profiles,
        COUNT(DISTINCT gender) as unique_genders,
        COUNT(DISTINCT location) as unique_locations,
        COUNT(DISTINCT education_level) as unique_education_levels,
        COUNT(DISTINCT income_range) as unique_income_ranges,
        ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))), 1) as average_age,
        COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days') as completed_last_30_days,
        COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days') as completed_last_7_days
    FROM public.profiles
    WHERE completed_at IS NOT NULL
    AND date_of_birth IS NOT NULL
),
gender_breakdown AS (
    SELECT
        jsonb_object_agg(
            COALESCE(gender, 'Not specified'),
            count
        ) as gender_distribution
    FROM (
        SELECT
            gender,
            COUNT(*) as count
        FROM public.profiles
        WHERE completed_at IS NOT NULL
        GROUP BY gender
    ) t
),
top_locations AS (
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'location', location,
                'count', count,
                'percentage', percentage
            ) ORDER BY count DESC
        ) as top_locations
    FROM (
        SELECT
            COALESCE(location, 'Not specified') as location,
            COUNT(*) as count,
            ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
        FROM public.profiles
        WHERE completed_at IS NOT NULL
        GROUP BY location
        ORDER BY COUNT(*) DESC
        LIMIT 10
    ) t
)
SELECT
    ps.total_completed_profiles,
    ps.unique_genders,
    ps.unique_locations,
    ps.unique_education_levels,
    ps.unique_income_ranges,
    ps.average_age,
    ps.completed_last_30_days,
    ps.completed_last_7_days,
    gb.gender_distribution,
    tl.top_locations,
    NOW() as calculated_at
FROM profile_stats ps
CROSS JOIN gender_breakdown gb
CROSS JOIN top_locations tl;

-- Create age_distribution view for charts
CREATE VIEW public.age_distribution AS
WITH age_stats AS (
    SELECT
        CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 18 THEN 'Under 18'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 24 THEN '18-24'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 45 AND 54 THEN '45-54'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 55 AND 64 THEN '55-64'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) >= 65 THEN '65+'
            ELSE 'Unknown'
        END as age_group,
        gender,
        COUNT(*) as count
    FROM public.profiles
    WHERE completed_at IS NOT NULL
    AND date_of_birth IS NOT NULL
    GROUP BY
        CASE
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 18 THEN 'Under 18'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 24 THEN '18-24'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 45 AND 54 THEN '45-54'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 55 AND 64 THEN '55-64'
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) >= 65 THEN '65+'
            ELSE 'Unknown'
        END,
        gender
)
SELECT
    age_group,
    SUM(count) as total_count,
    ROUND(SUM(count)::NUMERIC / SUM(SUM(count)) OVER () * 100, 2) as percentage,
    COUNT(*) FILTER (WHERE gender = 'Male') as male_count,
    COUNT(*) FILTER (WHERE gender = 'Female') as female_count,
    COUNT(*) FILTER (WHERE gender NOT IN ('Male', 'Female') OR gender IS NULL) as other_count,
    NOW() as calculated_at
FROM age_stats
WHERE age_group != 'Unknown'
GROUP BY age_group
ORDER BY
    CASE age_group
        WHEN 'Under 18' THEN 1
        WHEN '18-24' THEN 2
        WHEN '25-34' THEN 3
        WHEN '35-44' THEN 4
        WHEN '45-54' THEN 5
        WHEN '55-64' THEN 6
        WHEN '65+' THEN 7
    END;

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW public.survey_demographics IS 'Comprehensive demographic analysis of survey responses including age, gender, location, and other attributes';
COMMENT ON VIEW public.demographic_overview IS 'High-level demographic statistics for dashboard widgets';
COMMENT ON VIEW public.age_distribution IS 'Age group distribution analysis with gender breakdown';

-- Enable Row Level Security for views
ALTER MATERIALIZED VIEW public.survey_demographics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for survey_demographics
CREATE POLICY "Admin users can view survey demographics" ON public.survey_demographics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Grant permissions to authenticated users (admin users will be filtered by RLS)
GRANT SELECT ON public.survey_demographics TO authenticated;
GRANT SELECT ON public.demographic_overview TO authenticated;
GRANT SELECT ON public.age_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_survey_demographics() TO authenticated;