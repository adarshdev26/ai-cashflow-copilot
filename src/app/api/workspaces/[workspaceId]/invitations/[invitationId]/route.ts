import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ workspaceId: string; invitationId: string }> };

// Cancel a pending invitation. The old link stops working immediately.
export async function DELETE(req: Request, { params }: Ctx) {
    try {
        const { workspaceId, invitationId } = await params;
        const access = await requireWorkspaceAction(req, 'members.invite', workspaceId);
        if (!access.ok) return access.response;

        const existing = await prisma.workspaceInvitation.findFirst({
            where: { id: invitationId, workspaceId: access.workspaceId, status: 'PENDING' },
            select: { id: true, email: true, role: true, status: true },
        });
        // workspaceId is part of the filter, so an admin of workspace A can never
        // cancel an invitation that belongs to workspace B.
        const result = await prisma.workspaceInvitation.updateMany({
            where: { id: invitationId, workspaceId: access.workspaceId, status: 'PENDING' },
            data: { status: 'CANCELLED' },
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        if (existing) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.WORKSPACE_INVITATION_CANCELLED,
                resourceType: 'invitation',
                resourceId: existing.id,
                workspaceId: access.workspaceId,
                metadata: {
                    targetEmail: existing.email,
                    role: existing.role,
                    before: { status: existing.status },
                    after: { status: 'CANCELLED' },
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to cancel invitation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
