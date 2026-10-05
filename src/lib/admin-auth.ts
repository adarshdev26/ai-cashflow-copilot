import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export const ADMIN_COOKIE = 'admin_session';
const ADMIN_MAX_AGE_S = 60 * 60 * 8; // 8 hours
const ADMIN_AUDIENCE = 'admin';

type AdminTokenPayload = { adminId: string; iat?: number };
export type AdminSession = { adminId: string; email: string; name: string | null };

function getAdminSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET is missing from environment variables.');
  return secret;
}

const getAdminRow = cache(async (id: string) =>
  prisma.admin.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, isActive: true, passwordChangedAt: true },
  })
);

export async function getAdminSession(): Promise<AdminSession | null> {
  let decoded: AdminTokenPayload;
  try {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    decoded = jwt.verify(token, getAdminSecret(), { audience: ADMIN_AUDIENCE }) as AdminTokenPayload;
  } catch {
    return null;
  }

  const admin = await getAdminRow(decoded.adminId);
  if (!admin || !admin.isActive) return null;

  if (admin.passwordChangedAt) {
    const changedAtSec = Math.floor(admin.passwordChangedAt.getTime() / 1000);
    if ((decoded.iat ?? 0) < changedAtSec) return null;
  }
  return { adminId: admin.id, email: admin.email, name: admin.name };
}

export type AdminGuard = { ok: true; adminId: string } | { ok: false; response: NextResponse };

/** Call first in EVERY /api/admin/* handler except login/logout/invalid. */
export async function requireAdmin(): Promise<AdminGuard> {
  const session = await getAdminSession();
  if (!session) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { ok: true, adminId: session.adminId };
}

export async function setAdminCookie(admin: { id: string }) {
  const token = jwt.sign({ adminId: admin.id }, getAdminSecret(), {
    expiresIn: '8h',
    audience: ADMIN_AUDIENCE,
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_MAX_AGE_S,
    path: '/',
  });
}

export async function clearAdminCookie() {
  (await cookies()).set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}