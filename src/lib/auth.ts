import { cache } from 'react';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

type TokenPayload = { userId: string; email: string; iat?: number };

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables.');
  }
  return secret;
}

// One DB lookup per request, even if getSession() is called several times
// (layout + page + navbar).
const getPasswordChangedAt = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true, isActive: true },
  });
  return user; // null when the user no longer exists
});

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  let decoded: TokenPayload;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null; // missing, expired or tampered
  }

  // Outside the try/catch on purpose: a DB outage should surface as an error,
  // not silently log everyone out.
  const user = await getPasswordChangedAt(decoded.userId);
  if (!user) return null; // account was deleted
  if (!user.isActive) return null; // deactivated by an admin

  if (user.passwordChangedAt) {
    // JWT iat is in whole seconds, so compare in seconds. A token issued in the
    // same second as the reset (e.g. an immediate re-login) still counts as valid.
    const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if ((decoded.iat ?? 0) < changedAtSec) return null; // issued before the reset
  }

  return { userId: decoded.userId, email: decoded.email };
}

export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session ? session.userId : null;
}

// ---------------------------------------------------------------------------
// Auth cookie (one source of truth for login, invite register and logout)
// ---------------------------------------------------------------------------

export const AUTH_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

export function signAuthToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export async function setAuthCookie(user: { id: string; email: string }) {
  const cookieStore = await cookies();
  cookieStore.set('token', signAuthToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_COOKIE_MAX_AGE_S,
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}