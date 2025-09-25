import { NextRequest, NextResponse } from 'next/server';
import { signInAdmin } from '@/lib/admin/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signInAdmin(email, password);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Create response with proper headers
    const response = NextResponse.json(
      { success: true, user: result.user },
      { status: 200 }
    );

    // The cookies are already set by signInAdmin through Supabase auth,
    // but we need to ensure the response includes them
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}