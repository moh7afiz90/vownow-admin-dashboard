-- Migration: 002_audit_logs.sql
-- Description: Create audit_logs table with insert-only policies for tracking admin actions
-- Created: 2025-09-25

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all admin actions in the dashboard';
COMMENT ON COLUMN public.audit_logs.admin_user_id IS 'Reference to the admin user who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'The action performed (CREATE, UPDATE, DELETE, VIEW, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (user, report, setting, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before the change (for UPDATE actions)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after the change (for CREATE/UPDATE actions)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional contextual information about the action';
COMMENT ON COLUMN public.audit_logs.success IS 'Whether the action was successful';

-- Create indexes for performance
CREATE INDEX idx_audit_logs_admin_user_id ON public.audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON public.audit_logs(success);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_created_at ON public.audit_logs(admin_user_id, created_at);
CREATE INDEX idx_audit_logs_resource_type_created_at ON public.audit_logs(resource_type, created_at);
CREATE INDEX idx_audit_logs_action_created_at ON public.audit_logs(action, created_at);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs table

-- Policy: All admin users can insert audit logs (for logging their own actions)
CREATE POLICY "Admin users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.id = admin_user_id
        )
    );

-- Policy: Super admins and admins can view all audit logs
CREATE POLICY "Super admins and admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin')
        )
    );

-- Policy: Analysts can view audit logs for their own actions
CREATE POLICY "Analysts can view own audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role = 'analyst'
            AND au.id = admin_user_id
        )
    );

-- Policy: Viewers can view audit logs for their own actions
CREATE POLICY "Viewers can view own audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role = 'viewer'
            AND au.id = admin_user_id
        )
    );

-- No UPDATE or DELETE policies - audit logs are immutable once created

-- Function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
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
        error_message
    ) VALUES (
        p_admin_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_metadata,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_success,
        p_error_message
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;