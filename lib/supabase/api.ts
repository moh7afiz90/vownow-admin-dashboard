import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

// Route handler client for API routes
export async function createApiClient() {
  return createRouteHandlerClient<Database>({ cookies });
}