import { createHash, randomBytes } from 'node:crypto';

import { prisma } from '@/lib/db/prisma'; // adjust if your prisma client lives elsewhere
import { canWorkspaceAction } from '@/features/workspaces/permissions';
import type { TxClient } from '@/lib/db/db-types';
import { getSystemNumber } from '@/lib/settings/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// OWNER is deliberately absent: it can never be granted through an invitation.
export const INVITABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function isInvitableRole(value: unknown): value is InvitableRole {
    return typeof value === 'string' && (INVITABLE_ROLES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type InvitationErrorCode =
    | 'INVALID'
    | 'EXPIRED'
    | 'ACCEPTED'
    | 'CANCELLED'
    | 'ALREADY_MEMBER'
    | 'INVITER_NOT_ALLOWED'
    | 'EMAIL_MISMATCH';

const ERROR_META: Record<InvitationErrorCode, { status: number; message: string }> = {
    INVALID: { status: 404, message: 'This invitation link is invalid.' },
    EXPIRED: { status: 410, message: 'This invitation has expired. Ask for a new one.' },
    ACCEPTED: { status: 410, message: 'This invitation has already been used.' },
    CANCELLED: { status: 410, message: 'This invitation was cancelled.' },
    ALREADY_MEMBER: { status: 409, message: 'You are already a member of this workspace.' },
    INVITER_NOT_ALLOWED: {
        status: 403,
        message: 'This invitation is no longer valid. Ask for a new one.',
    },
    EMAIL_MISMATCH: {
        status: 403,
        message: 'This invitation was sent to a different email address.',
    },
};

export class InvitationError extends Error {
    code: InvitationErrorCode;
    status: number;

    constructor(code: InvitationErrorCode) {
        super(ERROR_META[code].message);
        this.name = 'InvitationError';
        this.code = code;
        this.status = ERROR_META[code].status;
    }
}

// ---------------------------------------------------------------------------
// Email + token helpers
// ---------------------------------------------------------------------------

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function emailsMatch(a: string, b: string): boolean {
    return normalizeEmail(a) === normalizeEmail(b);
}

// SHA-256 is enough here: the token is 256 random bits, so it cannot be
// brute-forced, and a fast hash lets us look the invitation up by tokenHash.
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// The raw token is returned ONCE to the caller. Only the hash is stored.
export function generateInvitationToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: hashToken(token) };
}

export async function getExpiryDate(from: Date = new Date()): Promise<Date> {
    const ttlHours = await getSystemNumber('invitations.expiryHours');
    return new Date(from.getTime() + ttlHours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Lookup + validation
// ---------------------------------------------------------------------------

export async function findInvitationByToken(token: string) {
    if (!token || token.length > 128) return null; // cheap guard against junk input

    return prisma.workspaceInvitation.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { workspace: { select: { id: true, name: true } } },
    });
}

export type InvitationWithWorkspace = NonNullable<
    Awaited<ReturnType<typeof findInvitationByToken>>
>;

// Throws InvitationError unless the invitation can still be used.
export function assertInvitationUsable(
    invitation: Pick<InvitationWithWorkspace, 'status' | 'expiresAt'>,
    now: Date = new Date(),
): void {
    if (invitation.status === 'ACCEPTED') throw new InvitationError('ACCEPTED');
    if (invitation.status === 'CANCELLED') throw new InvitationError('CANCELLED');
    if (invitation.expiresAt.getTime() <= now.getTime()) throw new InvitationError('EXPIRED');
}

// ---------------------------------------------------------------------------
// Accept (shared by the "existing user" and "new user" routes)
// ---------------------------------------------------------------------------

// MUST be called inside prisma.$transaction. Any throw rolls everything back,
// including the status flip, so a failed accept never burns the invitation.
export async function acceptInvitationTx(
    tx: TxClient,
    invitation: Pick<InvitationWithWorkspace, 'id' | 'workspaceId' | 'role' | 'invitedById'>,
    userId: string,
): Promise<void> {
    // 1. Friendly error if they're already in the workspace.
    const existing = await tx.workspaceAccess.findUnique({
        where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId } },
        select: { id: true },
    });
    if (existing) throw new InvitationError('ALREADY_MEMBER');

    // 2. Atomically claim the invitation. Only one caller can win this update,
    //    which is what makes the link single-use even under concurrent requests.
    const claimed = await tx.workspaceInvitation.updateMany({
        where: {
            id: invitation.id,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
        },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });
    if (claimed.count !== 1) {
        // Lost a race (or the link changed since it was checked). Re-read the row
        // so the caller sees the real reason instead of a generic "invalid".
        const current = await tx.workspaceInvitation.findUnique({
            where: { id: invitation.id },
            select: { status: true, expiresAt: true },
        });
        if (!current) throw new InvitationError('INVALID');
        assertInvitationUsable(current); // throws ACCEPTED / CANCELLED / EXPIRED
        throw new InvitationError('INVALID');
    }

    // 3. The inviter must STILL be allowed to invite (not demoted/removed since).
    const inviterAccess = await tx.workspaceAccess.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId: invitation.workspaceId,
                userId: invitation.invitedById,
            },
        },
        select: { role: true },
    });
    if (!canWorkspaceAction(inviterAccess?.role, 'members.invite')) {
        throw new InvitationError('INVITER_NOT_ALLOWED');
    }

    // 4. Grant access. Role and workspace come from the invitation row, never
    //    from the request. The unique(workspaceId, userId) index is the last
    //    line of defence against duplicates.
    try {
        await tx.workspaceAccess.create({
            data: {
                workspaceId: invitation.workspaceId,
                userId,
                role: invitation.role,
            },
        });
    } catch (err) {
        if ((err as { code?: string }).code === 'P2002') {
            throw new InvitationError('ALREADY_MEMBER');
        }
        throw err;
    }
}

// Fields that are safe to send to the browser. NEVER add tokenHash here.
export const invitationSelect = {
    id: true,
    email: true,
    role: true,
    status: true,
    expiresAt: true,
    createdAt: true,
    invitedBy: { select: { id: true, email: true } },
} as const;

export function isValidEmail(email: string): boolean {
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
