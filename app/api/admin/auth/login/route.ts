import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use route handler client to ensure cookies are properly set
    const supabase = await createApiClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Use service role client to check admin role (bypasses RLS)
    const adminSupabase = createServiceRoleClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Unauthorized: Admin access only' },
        { status: 401 }
      );
    }

    if (profile.status !== 'active') {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Account deactivated' },
        { status: 401 }
      );
    }

    // Create response - cookies are handled by Supabase auth helpers
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile.role
        }
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}