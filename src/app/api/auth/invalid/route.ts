import { NextResponse } from 'next/server';
import { getValidUser } from '@/lib/auth/session-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // If the session is actually fine, don't log anyone out. This also stops
  // other sites from logging users out by linking to this URL.
  const user = await getValidUser();
  if (user) return NextResponse.redirect(new URL('/dashboard', req.url));

  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.delete('token'); // same cookie name auth.ts reads
  return res;
}
