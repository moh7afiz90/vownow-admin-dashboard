-- Migration: 001_admin_users.sql
-- Description: Create admin_users table with RLS policies for admin dashboard access control
-- Created: 2025-09-25

-- Enable RLS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'analyst', 'viewer')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.admin_users(id),
    updated_by UUID REFERENCES public.admin_users(id)
);

-- Add comments for documentation
COMMENT ON TABLE public.admin_users IS 'Admin users with role-based access control for the admin dashboard';
COMMENT ON COLUMN public.admin_users.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN public.admin_users.role IS 'Admin role: super_admin, admin, analyst, or viewer';
COMMENT ON COLUMN public.admin_users.permissions IS 'JSON object containing specific permissions';
COMMENT ON COLUMN public.admin_users.is_active IS 'Whether the admin user account is active';

-- Create indexes for performance
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);
CREATE INDEX idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX idx_admin_users_created_at ON public.admin_users(created_at);

-- Create unique constraint on email
CREATE UNIQUE INDEX idx_admin_users_email_unique ON public.admin_users(email);
CREATE UNIQUE INDEX idx_admin_users_user_id_unique ON public.admin_users(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users table

-- Policy: Admin users can view all admin users
CREATE POLICY "Admin users can view all admin users" ON public.admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role IN ('super_admin', 'admin', 'analyst')
        )
    );

-- Policy: Super admins can insert new admin users
CREATE POLICY "Super admins can insert admin users" ON public.admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role = 'super_admin'
        )
    );

-- Policy: Super admins and admins can update admin users
CREATE POLICY "Super admins and admins can update admin users" ON public.admin_users
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

-- Policy: Only super admins can delete admin users
CREATE POLICY "Super admins can delete admin users" ON public.admin_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
            AND au.role = 'super_admin'
        )
    );

-- Policy: Users can view their own admin profile
CREATE POLICY "Users can view own admin profile" ON public.admin_users
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can update their own basic info (not role or permissions)
CREATE POLICY "Users can update own basic info" ON public.admin_users
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND role = OLD.role
        AND permissions = OLD.permissions
        AND is_active = OLD.is_active
    );