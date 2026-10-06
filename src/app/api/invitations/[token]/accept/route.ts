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
            select: { id: true, email: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'Please sign in to accept' }, { status: 401 });
        }
        if (!emailsMatch(user.email, invitation.email)) throw new InvitationError('EMAIL_MISMATCH');

        await prisma.$transaction((tx) => acceptInvitationTx(tx, invitation, user.id));

        return NextResponse.json({ workspaceId: invitation.workspaceId });
    } catch (error) {
        return invitationErrorResponse(error, 'Invitation accept error');
    }
}
