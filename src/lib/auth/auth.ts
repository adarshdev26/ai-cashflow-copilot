import { cache } from 'react';
import { cookies } from 'next/headers';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { getAdminSession } from '@/lib/admin/auth';
import { getSystemNumber } from '@/lib/settings/server';

type TokenPayload = {
    userId: string;
    email: string;
    iat?: number;
    impersonatedBy?: string;
    impersonatedAt?: number;
};

export type SessionInfo = {
    userId: string;
    email: string;
    impersonating: boolean;
    adminEmail: string | null;
    impersonatedBy: string | null;
};

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

export async function getSessionInfo(): Promise<SessionInfo | null> {
    let decoded: TokenPayload;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;

        decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    } catch {
        return null; // missing, expired or tampered
    }

    const user = await getPasswordChangedAt(decoded.userId);
    if (!user) return null;
    if (!user.isActive) return null;

    if (user.passwordChangedAt) {
        const changedAtSec = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if ((decoded.iat ?? 0) < changedAtSec) return null;
    }

    if (decoded.impersonatedBy) {
        const admin = await getAdminSession();
        if (!admin || admin.adminId !== decoded.impersonatedBy) return null;
        return {
            userId: decoded.userId,
            email: decoded.email,
            impersonating: true,
            adminEmail: admin.email,
            impersonatedBy: decoded.impersonatedBy,
        };
    }

    return {
        userId: decoded.userId,
        email: decoded.email,
        impersonating: false,
        adminEmail: null,
        impersonatedBy: null,
    };
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
    const session = await getSessionInfo();
    if (!session) return null;
    return { userId: session.userId, email: session.email };
}

export async function requireUserId(): Promise<string | null> {
    const session = await getSession();
    return session ? session.userId : null;
}

// ---------------------------------------------------------------------------
// Auth cookie (one source of truth for login, invite register and logout)
// ---------------------------------------------------------------------------

export const AUTH_COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days
export const TOKEN_BACKUP_COOKIE = 'token_backup';

export function signAuthToken(
    user: { id: string; email: string },
    options?: { expiresIn?: string; impersonatedBy?: string; impersonatedAt?: number },
): string {
    const payload = {
        userId: user.id,
        email: user.email,
        ...(options?.impersonatedBy ? { impersonatedBy: options.impersonatedBy } : {}),
        ...(typeof options?.impersonatedAt === 'number'
            ? { impersonatedAt: options.impersonatedAt }
            : {}),
    };

    const signOptions: SignOptions = {
        expiresIn:
            (options?.expiresIn as SignOptions['expiresIn']) ?? ('7d' as SignOptions['expiresIn']),
    };

    return jwt.sign(payload, getJwtSecret(), signOptions);
}

export async function setAuthCookie(
    user: { id: string; email: string },
    options?: {
        expiresInSeconds?: number;
        expiresIn?: string;
        impersonatedBy?: string;
        impersonatedAt?: number;
    },
) {
    const cookieStore = await cookies();
    const existingToken = cookieStore.get('token')?.value;
    const sessionSeconds = (await getSystemNumber('auth.userSessionDays')) * 86400;
    const maxAge = options?.expiresInSeconds ?? sessionSeconds;

    if (options?.impersonatedBy) {
        if (existingToken && !existingToken.includes('impersonatedBy')) {
            cookieStore.set(TOKEN_BACKUP_COOKIE, existingToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: sessionSeconds,
                path: '/',
            });
        }
    }

    cookieStore.set(
        'token',
        signAuthToken(user, {
            expiresIn: options?.expiresIn ?? `${maxAge}s`,
            impersonatedBy: options?.impersonatedBy,
            impersonatedAt: options?.impersonatedAt,
        }),
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge,
            path: '/',
        },
    );
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
    cookieStore.set(TOKEN_BACKUP_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
    });
}
