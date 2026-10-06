import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';

type Ctx = { params: Promise<{ workspaceId: string; invitationId: string }> };

// Cancel a pending invitation. The old link stops working immediately.
export async function DELETE(req: Request, { params }: Ctx) {
    try {
        const { workspaceId, invitationId } = await params;
        const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
        if (!access.ok) return access.response;

        // workspaceId is part of the filter, so an admin of workspace A can never
        // cancel an invitation that belongs to workspace B.
        const result = await prisma.workspaceInvitation.updateMany({
            where: { id: invitationId, workspaceId: access.workspaceId, status: 'PENDING' },
            data: { status: 'CANCELLED' },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
