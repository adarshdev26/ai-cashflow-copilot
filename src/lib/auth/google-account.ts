import 'server-only';
import { randomBytes } from 'crypto';
import type { Account, Profile } from 'next-auth';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { setAuthCookie } from '@/lib/auth/auth';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { getSystemBool } from '@/lib/settings/server';
import { createUserWithPersonalWorkspaceTx, hashPassword } from '@/lib/users/users';

const PROVIDER = 'google';

export type GoogleSignInFailure =
    | 'invalid'
    | 'unverified'
    | 'inactive'
    | 'signup_disabled'
    | 'conflict';

type AccountUser = {
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
};

function isUniqueConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function logFailed(email: string | null, user: AccountUser | null, reason: string) {
    await logAudit({
        actor: {
            type: 'USER',
            id: user?.id ?? null,
            name: user?.name ?? null,
            email: user?.email ?? email,
        },
        action: AUDIT_ACTIONS.USER_LOGIN_FAILED,
        resourceType: 'user',
        resourceId: user?.id,
        metadata: { reason, provider: PROVIDER },
    });
}

async function finishLogin(user: AccountUser, metadata: Record<string, unknown>) {
    await setAuthCookie({ id: user.id, email: user.email }, { sameSite: 'lax' });
    await logAudit({
        actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
        action: AUDIT_ACTIONS.USER_LOGIN_SUCCEEDED,
        resourceType: 'user',
        resourceId: user.id,
        metadata,
    });
}

async function findUserByEmail(email: string): Promise<AccountUser | null> {
    const select = { id: true, email: true, name: true, isActive: true } as const;
    const user =
        (await prisma.user.findUnique({ where: { email }, select })) ??
        (await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select,
        }));
    return user;
}

/**
 * Creates or links the app user for a Google profile, then sets the app session cookie.
 * New accounts get the same personal workspace as email signup.
 */
export async function signInWithGoogleAccount(
    profile: Profile | undefined,
    account: Account | null | undefined,
): Promise<true | GoogleSignInFailure> {
    if (account?.provider !== PROVIDER || !account.providerAccountId) return 'invalid';

    const email = typeof profile?.email === 'string' ? profile.email.trim() : '';
    if (!email) return 'invalid';
    if (profile?.email_verified !== true) {
        await logFailed(email, null, 'unverified_email');
        return 'unverified';
    }

    const name =
        typeof profile?.name === 'string' && profile.name.trim() ? profile.name.trim() : null;
    const providerAccountId = account.providerAccountId;

    const linked = await prisma.oauthAccount.findUnique({
        where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId } },
        select: { user: { select: { id: true, email: true, name: true, isActive: true } } },
    });

    if (linked) {
        if (!linked.user.isActive) {
            await logFailed(linked.user.email, linked.user, 'inactive_account');
            return 'inactive';
        }
        await finishLogin(linked.user, { provider: PROVIDER });
        return true;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
        if (!existing.isActive) {
            await logFailed(existing.email, existing, 'inactive_account');
            return 'inactive';
        }

        const otherGoogle = await prisma.oauthAccount.findUnique({
            where: { userId_provider: { userId: existing.id, provider: PROVIDER } },
            select: { providerAccountId: true },
        });
        if (otherGoogle && otherGoogle.providerAccountId !== providerAccountId) {
            await logFailed(existing.email, existing, 'oauth_account_conflict');
            return 'conflict';
        }

        if (!otherGoogle) {
            try {
                await prisma.oauthAccount.create({
                    data: { userId: existing.id, provider: PROVIDER, providerAccountId },
                });
            } catch (error) {
                if (!isUniqueConflict(error)) throw error;
            }
        }

        await finishLogin(existing, { provider: PROVIDER, linked: true });
        return true;
    }

    if (!(await getSystemBool('auth.signupEnabled'))) {
        await logFailed(email, null, 'signup_disabled');
        return 'signup_disabled';
    }

    const hashedPassword = await hashPassword(randomBytes(32).toString('hex'));
    let created: AccountUser;
    try {
        created = await prisma.$transaction(async (tx) => {
            const user = await createUserWithPersonalWorkspaceTx(tx, {
                email,
                hashedPassword,
                name,
            });
            await tx.oauthAccount.create({
                data: { userId: user.id, provider: PROVIDER, providerAccountId },
            });
            return { id: user.id, email: user.email, name: user.name, isActive: user.isActive };
        });
    } catch (error) {
        if (!isUniqueConflict(error)) throw error;
        const raced = await prisma.oauthAccount.findUnique({
            where: { provider_providerAccountId: { provider: PROVIDER, providerAccountId } },
            select: { user: { select: { id: true, email: true, name: true, isActive: true } } },
        });
        if (!raced?.user.isActive) return raced ? 'inactive' : 'invalid';
        await finishLogin(raced.user, { provider: PROVIDER });
        return true;
    }

    await logAudit({
        actor: { type: 'USER', id: created.id, name: created.name, email: created.email },
        action: AUDIT_ACTIONS.USER_REGISTERED,
        resourceType: 'user',
        resourceId: created.id,
        metadata: { targetName: created.name, targetEmail: created.email, provider: PROVIDER },
    });
    await finishLogin(created, { provider: PROVIDER });
    return true;
}
