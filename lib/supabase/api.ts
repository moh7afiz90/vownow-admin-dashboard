import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database.types';

// Route handler client for API routes
export async function createApiClient() {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
}