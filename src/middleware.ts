import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isOnboardingPage = pathname.startsWith('/onboarding');

  // 1. Protected pages without a token -> /login
  if ((isDashboardPage || isOnboardingPage) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Logged-in users on /login or /signup -> /dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Marketing pages (including "/") are public for everyone.
  // The navbar shows "Open <app>" for logged-in users instead of redirecting them.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/login', '/signup'],
};