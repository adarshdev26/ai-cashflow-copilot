import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { setAuthCookie } from '@/lib/auth/auth';
import {
    InvitationError,
    findInvitationByToken,
    assertInvitationUsable,
    acceptInvitationTx,
} from '@/lib/users/invitations';
import { invitationErrorResponse } from '@/lib/users/invitation-http';
import { getSystemNumber } from '@/lib/settings/server';
import { validatePassword } from '@/lib/validations/auth';
import { createUserWithPersonalWorkspaceTx, hashPassword } from '@/lib/users/users';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

const accountExistsResponse = () =>
    NextResponse.json(
        {
            error: 'An account already exists for this email. Please sign in.',
            code: 'ACCOUNT_EXISTS',
        },
        { status: 409 },
    );

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const { name, password } = await req.json();
        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }
        const passwordError = validatePassword(
            password,
            await getSystemNumber('auth.passwordMinLength'),
        );
        if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

        const invitation = await findInvitationByToken(token);
        if (!invitation) throw new InvitationError('INVALID');
        assertInvitationUsable(invitation);

        // Email comes only from the invitation, never from the request body.
        const findAccount = () =>
            prisma.user.findFirst({
                where: { email: { equals: invitation.email, mode: 'insensitive' } },
                select: { id: true },
            });

        if (await findAccount()) return accountExistsResponse();

        const blocked = await enforceWorkspaceLimit(invitation.workspaceId, 'maxCollaborators', 0);
        if (blocked) return blocked;

        const hashedPassword = await hashPassword(password); // outside the tx: bcrypt is slow

        let user;
        try {
            user = await prisma.$transaction(async (tx) => {
                const created = await createUserWithPersonalWorkspaceTx(tx, {
                    email: invitation.email,
                    hashedPassword,
                    name: typeof name === 'string' ? name : undefined,
                });
                await acceptInvitationTx(tx, invitation, created.id);
                return created;
            });
        } catch (e) {
            // P2002 can also come from something unrelated (e.g. a workspace slug
            // collision), so only report "account exists" if the account really exists.
            if ((e as { code?: string })?.code === 'P2002' && (await findAccount())) {
                return accountExistsResponse();
            }
            throw e;
        }

        await setAuthCookie(user);
        await logAudit({
            actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
            action: AUDIT_ACTIONS.USER_REGISTERED,
            resourceType: 'user',
            resourceId: user.id,
            metadata: { targetName: user.name, targetEmail: user.email },
            request: req,
        });
        await logAudit({
            actor: { type: 'USER', id: user.id, name: user.name, email: user.email },
            action: AUDIT_ACTIONS.WORKSPACE_INVITATION_ACCEPTED,
            resourceType: 'workspace',
            resourceId: invitation.workspaceId,
            workspaceId: invitation.workspaceId,
            metadata: {
                targetUserId: user.id,
                targetEmail: user.email,
                role: invitation.role,
                before: { status: 'PENDING' },
                after: { status: 'ACCEPTED' },
            },
        });
        return NextResponse.json(
            { message: 'Account created', userId: user.id, workspaceId: invitation.workspaceId },
            { status: 201 },
        );
    } catch (error) {
        return invitationErrorResponse(error, 'Invitation register error');
    }
}
