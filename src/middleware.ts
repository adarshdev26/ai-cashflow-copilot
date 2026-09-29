import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isDashboardPage = pathname.startsWith('/dashboard') || pathname === '/';
  const isOnboardingPage = pathname.startsWith('/onboarding');

  // 1. If user is trying to access dashboard/root/onboarding without a token, redirect to /login
  if ((isDashboardPage || isOnboardingPage) && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user is already logged in and tries to hit /login or /signup, redirect to /dashboard
  if (isAuthPage && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding/:path*', '/login', '/signup'],
};