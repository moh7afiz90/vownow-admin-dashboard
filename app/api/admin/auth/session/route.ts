import { NextRequest, NextResponse } from 'next/server';
import { ServerSessionManager } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Validate session using our session manager
    const sessionResult = await ServerSessionManager.getCurrentSession();

    if (!sessionResult.success) {
      return NextResponse.json(
        {
          valid: false,
          error: sessionResult.error.error
        },
        { status: 401 }
      );
    }

    const { user, adminUser, twoFactorVerified } = sessionResult.session;

    // Return session validation response
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: adminUser.role,
        twoFactorEnabled: adminUser.two_factor_enabled,
        twoFactorVerified,
      },
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Session validation failed'
      },
      { status: 500 }
    );
  }
}