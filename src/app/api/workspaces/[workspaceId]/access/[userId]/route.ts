import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { WorkspaceRole } from '@/generated/prisma';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
    try {
        const { workspaceId, userId: targetUserId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
        if (!access.ok) return access.response;

        const body = await req.json();
        const { role } = body;

        if (!role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
            return NextResponse.json(
                { error: 'Valid role (ADMIN, MEMBER, VIEWER) is required' },
                { status: 400 },
            );
        }

        const targetAccess = await prisma.workspaceAccess.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: access.workspaceId,
                    userId: targetUserId,
                },
            },
            include: { user: { select: { id: true, email: true } } },
        });

        if (!targetAccess) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        if (targetAccess.role === 'OWNER') {
            return NextResponse.json(
                { error: 'Cannot modify the role of an OWNER' },
                { status: 403 },
            );
        }

        const updatedAccess = await prisma.workspaceAccess.update({
            where: {
                workspaceId_userId: {
                    workspaceId: access.workspaceId,
                    userId: targetUserId,
                },
            },
            data: { role: role as WorkspaceRole },
            include: {
                user: {
                    select: { id: true, email: true },
                },
            },
        });

        if (targetAccess.role !== updatedAccess.role) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.WORKSPACE_MEMBER_ROLE_CHANGED,
                resourceType: 'workspace',
                resourceId: access.workspaceId,
                workspaceId: access.workspaceId,
                metadata: {
                    targetUserId: updatedAccess.user.id,
                    targetEmail: updatedAccess.user.email,
                    before: { role: targetAccess.role },
                    after: { role: updatedAccess.role },
                },
            });
        }

        return NextResponse.json(updatedAccess);
    } catch (error) {
        console.error('Failed to update member role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string; userId: string }> },
) {
    try {
        const { workspaceId, userId: targetUserId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
        if (!access.ok) return access.response;

        const targetAccess = await prisma.workspaceAccess.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: access.workspaceId,
                    userId: targetUserId,
                },
            },
            include: { user: { select: { id: true, email: true } } },
        });

        if (!targetAccess) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Ownership can't be transferred yet, so the owner is never removable.
        if (targetAccess.role === 'OWNER') {
            return NextResponse.json(
                { error: 'Cannot remove the workspace owner' },
                { status: 403 },
            );
        }

        await prisma.workspaceAccess.delete({
            where: {
                workspaceId_userId: {
                    workspaceId: access.workspaceId,
                    userId: targetUserId,
                },
            },
        });

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.WORKSPACE_MEMBER_REMOVED,
            resourceType: 'workspace',
            resourceId: access.workspaceId,
            workspaceId: access.workspaceId,
            metadata: {
                targetUserId: targetAccess.user.id,
                targetEmail: targetAccess.user.email,
                previousRole: targetAccess.role,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Failed to remove member:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
