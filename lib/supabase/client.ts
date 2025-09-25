import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

// Browser client for client components
export function createBrowserClient() {
  return createClientComponentClient<Database>();
}

// Alternative browser client with manual config
export function createBrowserSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
}

// Export the default browser client
export const supabase = createBrowserSupabase();