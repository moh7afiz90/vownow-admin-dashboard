-- Migration: 004_widgets.sql
-- Description: Create dashboard_widgets configuration table for customizable dashboard layouts
-- Created: 2025-09-25

-- Create widget_types enum for better type safety
CREATE TYPE widget_type AS ENUM (
    'metric_card',
    'chart_line',
    'chart_bar',
    'chart_pie',
    'chart_area',
    'table',
    'list',
    'map',
    'text',
    'iframe',
    'custom'
);

-- Create dashboard_widgets table
CREATE TABLE public.dashboard_widgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    widget_type widget_type NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    configuration JSONB NOT NULL DEFAULT '{}',
    data_source JSONB DEFAULT '{}',
    layout JSONB DEFAULT '{}', -- Position, size, etc.
    permissions JSONB DEFAULT '{}', -- Role-based visibility
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- System widgets cannot be deleted
    refresh_interval INTEGER DEFAULT 300, -- Seconds, null for no auto-refresh
    last_refreshed_at TIMESTAMPTZ,
    cache_duration INTEGER DEFAULT 60, -- Cache duration in seconds
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.admin_users(id),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Create user_widget_preferences table for personalized dashboard layouts
CREATE TABLE public.user_widget_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    widget_id UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT true,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    custom_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create widget_data_cache table for caching widget data
CREATE TABLE public.widget_data_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    widget_id UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
    cache_key VARCHAR(500) NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.dashboard_widgets IS 'Configuration for dashboard widgets including layout and data sources';
COMMENT ON COLUMN public.dashboard_widgets.widget_type IS 'Type of widget (metric_card, chart_line, etc.)';
COMMENT ON COLUMN public.dashboard_widgets.configuration IS 'Widget-specific configuration (chart options, colors, etc.)';
COMMENT ON COLUMN public.dashboard_widgets.data_source IS 'Data source configuration (query, API endpoint, etc.)';
COMMENT ON COLUMN public.dashboard_widgets.layout IS 'Layout properties (position, size, responsive settings)';
COMMENT ON COLUMN public.dashboard_widgets.permissions IS 'Role-based visibility and interaction permissions';
COMMENT ON COLUMN public.dashboard_widgets.is_system IS 'System widgets cannot be deleted by users';
COMMENT ON COLUMN public.dashboard_widgets.refresh_interval IS 'Auto-refresh interval in seconds, null for no auto-refresh';

COMMENT ON TABLE public.user_widget_preferences IS 'User-specific widget preferences and custom layouts';
COMMENT ON TABLE public.widget_data_cache IS 'Cache for widget data to improve performance';

-- Create indexes for performance
-- Dashboard widgets indexes
CREATE INDEX idx_dashboard_widgets_widget_type ON public.dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_category ON public.dashboard_widgets(category);
CREATE INDEX idx_dashboard_widgets_is_active ON public.dashboard_widgets(is_active);
CREATE INDEX idx_dashboard_widgets_is_system ON public.dashboard_widgets(is_system);
CREATE INDEX idx_dashboard_widgets_sort_order ON public.dashboard_widgets(sort_order);
CREATE INDEX idx_dashboard_widgets_created_by ON public.dashboard_widgets(created_by);
CREATE INDEX idx_dashboard_widgets_refresh_interval ON public.dashboard_widgets(refresh_interval) WHERE refresh_interval IS NOT NULL;

-- User widget preferences indexes
CREATE INDEX idx_user_widget_preferences_admin_user_id ON public.user_widget_preferences(admin_user_id);
CREATE INDEX idx_user_widget_preferences_widget_id ON public.user_widget_preferences(widget_id);
CREATE INDEX idx_user_widget_preferences_is_visible ON public.user_widget_preferences(is_visible);

-- Widget data cache indexes
CREATE INDEX idx_widget_data_cache_widget_id ON public.widget_data_cache(widget_id);
CREATE INDEX idx_widget_data_cache_cache_key ON public.widget_data_cache(cache_key);
CREATE INDEX idx_widget_data_cache_expires_at ON public.widget_data_cache(expires_at);

-- Unique constraints
CREATE UNIQUE INDEX idx_user_widget_preferences_unique ON public.user_widget_preferences(admin_user_id, widget_id);
CREATE UNIQUE INDEX idx_widget_data_cache_unique ON public.widget_data_cache(widget_id, cache_key);

-- Create triggers for updated_at
CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON public.dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_widget_preferences_updated_at
    BEFORE UPDATE ON public.user_widget_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_widget_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_data_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_widgets
CREATE POLICY "Admin users can view widgets based on permissions" ON public.dashboard_widgets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND (
                -- Widget has no role restrictions
                (permissions->>'roles' IS NULL OR permissions->>'roles' = '[]')
                OR
                -- User's role is in the allowed roles
                (permissions->'roles' ? au.role)
                OR
                -- Super admins can see all widgets
                au.role = 'super_admin'
            )
        )
    );

CREATE POLICY "Admins can create widgets" ON public.dashboard_widgets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update widgets" ON public.dashboard_widgets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can delete non-system widgets" ON public.dashboard_widgets
    FOR DELETE USING (
        NOT is_system
        AND EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for user_widget_preferences
CREATE POLICY "Users can view own widget preferences" ON public.user_widget_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.id = admin_user_id
        )
    );

CREATE POLICY "Users can manage own widget preferences" ON public.user_widget_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.id = admin_user_id
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.id = admin_user_id
        )
    );

-- RLS Policies for widget_data_cache
CREATE POLICY "Admin users can view cache for accessible widgets" ON public.widget_data_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.dashboard_widgets dw
            JOIN public.admin_users au ON au.user_id = auth.uid()
            WHERE dw.id = widget_id
            AND au.is_active = true
            AND (
                -- Widget has no role restrictions
                (dw.permissions->>'roles' IS NULL OR dw.permissions->>'roles' = '[]')
                OR
                -- User's role is in the allowed roles
                (dw.permissions->'roles' ? au.role)
                OR
                -- Super admins can access all cache
                au.role = 'super_admin'
            )
        )
    );

CREATE POLICY "System can manage widget cache" ON public.widget_data_cache
    FOR ALL USING (true) WITH CHECK (true);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_widget_cache() RETURNS void AS $$
BEGIN
    DELETE FROM public.widget_data_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user's widget layout
CREATE OR REPLACE FUNCTION get_user_widget_layout(p_admin_user_id UUID)
RETURNS TABLE(
    widget_id UUID,
    widget_name VARCHAR(255),
    widget_type widget_type,
    category VARCHAR(100),
    configuration JSONB,
    layout JSONB,
    is_visible BOOLEAN,
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    custom_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dw.id,
        dw.name,
        dw.widget_type,
        dw.category,
        dw.configuration,
        dw.layout,
        COALESCE(uwp.is_visible, true) as is_visible,
        COALESCE(uwp.position_x, (dw.layout->>'x')::INTEGER, 0) as position_x,
        COALESCE(uwp.position_y, (dw.layout->>'y')::INTEGER, 0) as position_y,
        COALESCE(uwp.width, (dw.layout->>'width')::INTEGER, 1) as width,
        COALESCE(uwp.height, (dw.layout->>'height')::INTEGER, 1) as height,
        COALESCE(uwp.custom_config, '{}'::JSONB) as custom_config
    FROM public.dashboard_widgets dw
    LEFT JOIN public.user_widget_preferences uwp ON dw.id = uwp.widget_id AND uwp.admin_user_id = p_admin_user_id
    WHERE dw.is_active = true
    ORDER BY dw.sort_order, dw.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;