// Export all Supabase clients and utilities
export { createBrowserClient, createBrowserSupabase, getSupabase, supabase } from './client';
export { createServerClient, createServiceRoleClient, createAdminClient } from './server';
export { createMiddlewareClient } from './middleware';

// Re-export for backward compatibility
export { supabase as default } from './client';