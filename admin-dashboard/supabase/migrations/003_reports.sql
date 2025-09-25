-- Migration: 003_reports.sql
-- Description: Create reports table and schedules for automated report generation
-- Created: 2025-09-25

-- Create report_templates table
CREATE TABLE public.report_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(100) NOT NULL CHECK (template_type IN ('analytics', 'demographic', 'conversion', 'custom')),
    configuration JSONB NOT NULL DEFAULT '{}',
    sql_query TEXT,
    chart_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.admin_users(id),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Create reports table
CREATE TABLE public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES public.report_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    data JSONB,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed', 'scheduled')),
    error_message TEXT,
    file_url TEXT,
    file_size BIGINT,
    expires_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    access_token VARCHAR(255),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.admin_users(id),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Create report_schedules table
CREATE TABLE public.report_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cron_expression VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    recipients JSONB DEFAULT '[]', -- Array of email addresses
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.admin_users(id),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Create report_executions table (for tracking scheduled report runs)
CREATE TABLE public.report_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    schedule_id UUID REFERENCES public.report_schedules(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Add comments for documentation
COMMENT ON TABLE public.report_templates IS 'Reusable report templates with configurations';
COMMENT ON TABLE public.reports IS 'Generated reports based on templates';
COMMENT ON TABLE public.report_schedules IS 'Scheduled report generation configurations';
COMMENT ON TABLE public.report_executions IS 'Execution history for scheduled reports';

-- Create indexes for performance
-- Report templates indexes
CREATE INDEX idx_report_templates_template_type ON public.report_templates(template_type);
CREATE INDEX idx_report_templates_is_active ON public.report_templates(is_active);
CREATE INDEX idx_report_templates_created_by ON public.report_templates(created_by);

-- Reports indexes
CREATE INDEX idx_reports_template_id ON public.reports(template_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_by ON public.reports(created_by);
CREATE INDEX idx_reports_created_at ON public.reports(created_at);
CREATE INDEX idx_reports_expires_at ON public.reports(expires_at);
CREATE INDEX idx_reports_is_public ON public.reports(is_public);
CREATE INDEX idx_reports_access_token ON public.reports(access_token) WHERE access_token IS NOT NULL;

-- Report schedules indexes
CREATE INDEX idx_report_schedules_template_id ON public.report_schedules(template_id);
CREATE INDEX idx_report_schedules_is_active ON public.report_schedules(is_active);
CREATE INDEX idx_report_schedules_next_run_at ON public.report_schedules(next_run_at);
CREATE INDEX idx_report_schedules_created_by ON public.report_schedules(created_by);

-- Report executions indexes
CREATE INDEX idx_report_executions_schedule_id ON public.report_executions(schedule_id);
CREATE INDEX idx_report_executions_report_id ON public.report_executions(report_id);
CREATE INDEX idx_report_executions_status ON public.report_executions(status);
CREATE INDEX idx_report_executions_started_at ON public.report_executions(started_at);

-- Create triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON public.report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
    BEFORE UPDATE ON public.report_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Admin users can view report templates" ON public.report_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Admins can manage report templates" ON public.report_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for reports
CREATE POLICY "Admin users can view reports" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Admin users can create reports" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND (au.id = created_by OR au.role IN ('super_admin', 'admin'))
        )
    );

CREATE POLICY "Admins can delete reports" ON public.reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for report_schedules
CREATE POLICY "Admin users can view report schedules" ON public.report_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Admins can manage report schedules" ON public.report_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for report_executions
CREATE POLICY "Admin users can view report executions" ON public.report_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Function to generate access token for public reports
CREATE OR REPLACE FUNCTION generate_report_access_token() RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;