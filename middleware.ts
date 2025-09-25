import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin routes that require authentication
const ADMIN_PROTECTED_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/users',
  '/admin/analytics',
  '/admin/reports',
  '/admin/settings',
  '/admin/audit',
];

// Public admin routes that don't require authentication
const ADMIN_PUBLIC_ROUTES = [
  '/admin/login',
  '/admin/login/2fa',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-admin routes, static files, and API routes
  if (!pathname.startsWith('/admin') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public admin routes
  if (ADMIN_PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = pathname === '/admin' || ADMIN_PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Get the auth token from cookies
    const cookieStore = request.cookies;
    const authToken = cookieStore.get('sb-nukophdrrycvhivztujf-auth-token');

    if (!authToken) {
      // No auth token, redirect to login
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Parse the token to get user info (basic check)
    let tokenData;
    try {
      // The cookie value is URL encoded JSON array
      const decodedValue = decodeURIComponent(authToken.value);
      tokenData = JSON.parse(decodedValue);
    } catch (e) {
      // Invalid token format
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'session');
      return NextResponse.redirect(redirectUrl);
    }

    // Extract the JWT token (first element of the array)
    const jwtToken = tokenData[0];
    if (!jwtToken) {
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'session');
      return NextResponse.redirect(redirectUrl);
    }

    // Decode JWT to get user ID (without verification for now)
    const base64Url = jwtToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);

    if (!payload.sub) {
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'session');
      return NextResponse.redirect(redirectUrl);
    }

    // Use service role to check profile (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'config');
      return NextResponse.redirect(redirectUrl);
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has admin role in profiles table
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role, status')
      .eq('id', payload.sub)
      .single();

    if (profileError || !profile) {
      // User exists but profile not found
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin role
    if (!['admin', 'super_admin'].includes(profile.role)) {
      // User exists but is not an admin
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    if (profile.status !== 'active') {
      // Admin account is not active
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'deactivated');
      return NextResponse.redirect(redirectUrl);
    }

    // For backward compatibility with 2FA checks
    const adminUser = {
      role: profile.role,
      is_active: profile.status === 'active',
      two_factor_enabled: false // Set to false since profiles table doesn't have this field
    };

    // Check 2FA requirement for sensitive routes
    const requiresTwoFactor = [
      '/admin/users',
      '/admin/settings',
      '/admin/audit',
    ].some(route => pathname.startsWith(route));

    if (requiresTwoFactor && adminUser.two_factor_enabled) {
      // Check if 2FA session is valid
      const twoFactorCookie = request.cookies.get('admin-2fa-verified');
      if (!twoFactorCookie) {
        const redirectUrl = new URL('/admin/login/2fa', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Verify 2FA session timestamp (valid for 1 hour)
      try {
        const twoFactorData = JSON.parse(twoFactorCookie.value);
        const now = Date.now();
        const sessionAge = now - twoFactorData.timestamp;
        const oneHour = 60 * 60 * 1000;

        if (sessionAge > oneHour) {
          const redirectUrl = new URL('/admin/login/2fa', request.url);
          redirectUrl.searchParams.set('redirect', pathname);
          const response = NextResponse.redirect(redirectUrl);
          response.cookies.delete('admin-2fa-verified');
          return response;
        }
      } catch {
        // Invalid 2FA cookie format
        const redirectUrl = new URL('/admin/login/2fa', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('admin-2fa-verified');
        return response;
      }
    }

    // Add user info to headers for downstream components
    const response = NextResponse.next();
    response.headers.set('x-admin-user-id', payload.sub);
    response.headers.set('x-admin-user-role', profile.role);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);

    // Redirect to login on any error
    const redirectUrl = new URL('/admin/login', request.url);
    redirectUrl.searchParams.set('error', 'session');
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all admin routes
     */
    '/admin/:path*',
  ],
};