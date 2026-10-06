import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/auth';
import {
    InvitationError,
    findInvitationByToken,
    assertInvitationUsable,
    emailsMatch,
    acceptInvitationTx,
} from '@/lib/users/invitations';
import { invitationErrorResponse } from '@/lib/users/invitation-http';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Please sign in to accept' }, { status: 401 });
        }

        const { token } = await params;
        const invitation = await findInvitationByToken(token);
        if (!invitation) throw new InvitationError('INVALID');
        assertInvitationUsable(invitation);

        // Use the DB email, not the JWT's, in case it changed since login.
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, name: true, email: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'Please sign in to accept' }, { status: 401 });
        }
        if (!emailsMatch(user.email, invitation.email)) throw new InvitationError('EMAIL_MISMATCH');

        const blocked = await enforceWorkspaceLimit(invitation.workspaceId, 'maxCollaborators', 0)
        if (blocked) return blocked;

        await prisma.$transaction((tx) => acceptInvitationTx(tx, invitation, user.id));

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

        return NextResponse.json({ workspaceId: invitation.workspaceId });
    } catch (error) {
        return invitationErrorResponse(error, 'Invitation accept error');
    }
}
