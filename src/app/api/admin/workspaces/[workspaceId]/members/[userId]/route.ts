import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { setMemberRole, removeMember } from '@/lib/admin/workspaces';
import { prisma } from '@/lib/db/prisma';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
type Ctx = { params: Promise<{ workspaceId: string; userId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId, userId } = await params;
    const body = await req.json().catch(() => null);
    if (!ROLES.includes(body?.role))
        return NextResponse.json({ error: 'A valid role is required' }, { status: 400 });

    const [workspace, existingAccess, target] = await Promise.all([
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true, owner: { select: { name: true, email: true } } },
        }),
        prisma.workspaceAccess.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true },
        }),
    ]);
    const result = await setMemberRole(workspaceId, userId, body.role);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const action =
        body.role === 'OWNER' && workspace?.ownerId !== userId
            ? AUDIT_ACTIONS.WORKSPACE_OWNERSHIP_TRANSFERRED
            : existingAccess
              ? existingAccess.role !== body.role
                  ? AUDIT_ACTIONS.WORKSPACE_MEMBER_ROLE_CHANGED
                  : null
              : AUDIT_ACTIONS.WORKSPACE_MEMBER_ADDED;
    if (action) {
        await logAudit({
            actor: await adminActor(g.adminId),
            action,
            resourceType: 'workspace',
            resourceId: workspaceId,
            workspaceId,
            metadata: {
                targetUserId: userId,
                targetEmail: target?.email ?? null,
                ...(action === AUDIT_ACTIONS.WORKSPACE_OWNERSHIP_TRANSFERRED
                    ? { previousOwnerEmail: workspace?.owner.email ?? null, role: 'OWNER' }
                    : {
                          ...(existingAccess ? { before: { role: existingAccess.role } } : {}),
                          after: { role: body.role },
                      }),
            },
            request: req,
        });
    }
    return NextResponse.json({ message: 'Role updated' });
}

export async function DELETE(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId, userId } = await params;

    const targetAccess = await prisma.workspaceAccess.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { role: true, user: { select: { id: true, name: true, email: true } } },
    });
    const result = await removeMember(workspaceId, userId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    if (targetAccess) {
        await logAudit({
            actor: await adminActor(g.adminId),
            action: AUDIT_ACTIONS.WORKSPACE_MEMBER_REMOVED,
            resourceType: 'workspace',
            resourceId: workspaceId,
            workspaceId,
            metadata: {
                targetUserId: targetAccess.user.id,
                targetName: targetAccess.user.name,
                targetEmail: targetAccess.user.email,
                previousRole: targetAccess.role,
            },
            request: req,
        });
    }
    return new NextResponse(null, { status: 204 });
}
