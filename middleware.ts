import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// Admin routes that require authentication
const ADMIN_PROTECTED_ROUTES = [
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
  const isProtectedRoute = ADMIN_PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    const response = NextResponse.next();
    const supabase = await createMiddlewareClient(request, response);

    // Get user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      // Redirect to login if no valid session
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin role
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, is_active, two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      // User exists but is not an admin
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    if (!adminUser.is_active) {
      // Admin account is deactivated
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('error', 'deactivated');
      return NextResponse.redirect(redirectUrl);
    }

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
    response.headers.set('x-admin-user-id', user.id);
    response.headers.set('x-admin-user-role', adminUser.role);

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
     * Match all admin routes except:
     * - /admin/login (and subpaths)
     * - Static files and API routes
     */
    '/admin/((?!login|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};