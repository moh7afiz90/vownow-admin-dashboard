import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database.types';

export async function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createMiddlewareClient<Database>({ req, res });
}