import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string }> },
) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId } = await params;
    const body = await req.json().catch(() => null);
    if (typeof body?.isActive !== 'boolean')
        return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });

    const exists = await prisma.workspace.findUnique({
        where: { id: workspaceId },
            select: { id: true, name: true, isActive: true },
    });
    if (!exists) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { isActive: body.isActive },
        select: { id: true, isActive: true },
    });
        if (exists.isActive !== workspace.isActive) {
            await logAudit({
                actor: await adminActor(g.adminId),
                action: AUDIT_ACTIONS.WORKSPACE_STATUS_CHANGED,
                resourceType: 'workspace',
                resourceId: workspace.id,
                workspaceId: workspace.id,
                metadata: {
                    targetName: exists.name,
                    before: { isActive: exists.isActive },
                    after: { isActive: workspace.isActive },
                },
                request: req,
            });
        }
    return NextResponse.json({ workspace });
}
