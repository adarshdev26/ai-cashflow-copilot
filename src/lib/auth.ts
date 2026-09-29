import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const AUTH_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing from environment variables.');
  }
  return secret;
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session ? session.userId : null;
}

export function signAuthToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: AUTH_COOKIE_MAX_AGE_S,
  })
}

export async function setAuthCookie(user: { id: string; email: string }) {
  const cookieStore = await cookies()
  cookieStore.set('token', signAuthToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_S,
  })
}