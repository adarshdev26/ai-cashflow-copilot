import { cache } from 'react';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { getSystemNumber } from '@/lib/settings/server';

export const ADMIN_COOKIE = 'admin_session';
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
    }),
);

export async function getAdminSession(): Promise<AdminSession | null> {
    let decoded: AdminTokenPayload;
    try {
        const token = (await cookies()).get(ADMIN_COOKIE)?.value;
        if (!token) return null;
        decoded = jwt.verify(token, getAdminSecret(), {
            audience: ADMIN_AUDIENCE,
        }) as AdminTokenPayload;
    } catch {
        return null;
    }
    const admin = await getAdminRow(decoded.adminId);
    if (!admin || !admin.isActive) return null;
    if (
        admin.passwordChangedAt &&
        (decoded.iat ?? 0) < Math.floor(admin.passwordChangedAt.getTime() / 1000)
    )
        return null;
    return { adminId: admin.id, email: admin.email, name: admin.name };
}

export type AdminGuard = { ok: true; adminId: string } | { ok: false; response: NextResponse };
/** Call first in EVERY /api/admin/* handler except login/logout/invalid. */
export async function requireAdmin(): Promise<AdminGuard> {
    const session = await getAdminSession();
    if (!session)
        return {
            ok: false,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    return { ok: true, adminId: session.adminId };
}

export async function setAdminCookie(admin: { id: string }, sessionHours?: number) {
    const hours = sessionHours ?? (await getSystemNumber('auth.adminSessionHours'));
    const token = jwt.sign({ adminId: admin.id }, getAdminSecret(), {
        expiresIn: `${hours}h`,
        audience: ADMIN_AUDIENCE,
    });
    (await cookies()).set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: hours * 3600,
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
