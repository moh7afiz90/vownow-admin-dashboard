import { NextRequest, NextResponse } from 'next/server';
import { TotpUtils } from '@/lib/auth/2fa';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ServerSessionManager } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { temporaryToken, code } = await request.json();

    if (!temporaryToken || !code) {
      return NextResponse.json(
        { error: 'Temporary token and verification code are required' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    // Verify temporary token and get user info
    // In a real implementation, you would validate the temporary token
    // For now, we'll simulate this process
    const supabase = createServiceRoleClient();

    // Decode temporary token to get user info (simplified for demo)
    let userId: string;
    try {
      // This would normally decode a JWT or lookup from Redis/database
      const tokenData = JSON.parse(Buffer.from(temporaryToken, 'base64').toString());
      userId = tokenData.userId;

      // Verify token hasn't expired (e.g., 5 minutes)
      if (Date.now() - tokenData.timestamp > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Temporary token expired' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid temporary token' },
        { status: 400 }
      );
    }

    // Get user's 2FA secret from database
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, two_factor_secret, two_factor_enabled')
      .eq('id', userId)
      .single();

    if (userError || !adminUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    if (!adminUser.two_factor_enabled || !adminUser.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Validate TOTP code
    const isValidCode = TotpUtils.validateTotpCode(adminUser.two_factor_secret, code);

    if (!isValidCode.isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Get user data for response
    const { data: userData, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !userData.user) {
      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: 500 }
      );
    }

    // Create session token (in real app, this would be a proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      timestamp: Date.now(),
      twoFactorVerified: true,
    })).toString('base64');

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/admin',
    });

    // Set 2FA verification cookie
    await ServerSessionManager.setTwoFactorVerified(adminUser.id);

    // Log successful 2FA verification
    await ServerSessionManager.logAction('2fa_verification_success', {
      userId: adminUser.id,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      token: sessionToken,
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}