import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isHome = pathname === '/';
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isDashboardPage = pathname.startsWith('/dashboard'); // '/' removed: it's public now
  const isOnboardingPage = pathname.startsWith('/onboarding');

  // 1. Protected pages without a token -> /login
  if ((isDashboardPage || isOnboardingPage) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Logged-in users on /login or /signup -> /dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. OPTIONAL: logged-in users on the landing page -> /dashboard
  //    (keeps the old behavior of "/"). Delete this block if you want
  //    logged-in users to be able to view the marketing home page.
  if (isHome && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding/:path*', '/login', '/signup'],
};