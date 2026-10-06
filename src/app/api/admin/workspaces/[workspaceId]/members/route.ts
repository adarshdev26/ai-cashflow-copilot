import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setMemberRole } from '@/lib/admin/workspaces';
import { normalizeEmail } from '@/lib/admin/users';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId } = await params;
    const body = await req.json().catch(() => null);

    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const role = body?.role;
    if (!email || !ROLES.includes(role))
        return NextResponse.json({ error: 'email and a valid role are required' }, { status: 400 });

    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: 'No user with that email' }, { status: 404 });

    const [workspace, existingAccess] = await Promise.all([
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true, owner: { select: { name: true, email: true } } },
        }),
        prisma.workspaceAccess.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: user.id } },
            select: { role: true },
        }),
    ]);

    if (!existingAccess && role !== 'OWNER') {
        const blocked = await enforceWorkspaceLimit(workspaceId, 'maxCollaborators');
        if (blocked) return blocked;
    }

    const result = await setMemberRole(workspaceId, user.id, role);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const action =
        role === 'OWNER' && workspace?.ownerId !== user.id
            ? AUDIT_ACTIONS.WORKSPACE_OWNERSHIP_TRANSFERRED
            : existingAccess
              ? existingAccess.role !== role
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
                targetUserId: user.id,
                targetEmail: user.email,
                ...(action === AUDIT_ACTIONS.WORKSPACE_OWNERSHIP_TRANSFERRED
                    ? { previousOwnerEmail: workspace?.owner.email ?? null, role: 'OWNER' }
                    : {
                          ...(existingAccess ? { before: { role: existingAccess.role } } : {}),
                          after: { role },
                      }),
            },
            request: req,
        });
    }
    return NextResponse.json({ message: 'Member saved' }, { status: 201 });
}
