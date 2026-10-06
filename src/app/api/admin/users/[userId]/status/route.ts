import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;
    const body = await req.json().catch(() => null);
    if (typeof body?.isActive !== 'boolean')
        return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });

    const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, name: true, email: true },
    });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: body.isActive },
        select: { id: true, isActive: true },
    });

    if (existing.isActive !== user.isActive) {
        await logAudit({
            actor: await adminActor(g.adminId),
            action: user.isActive ? AUDIT_ACTIONS.USER_UNSUSPENDED : AUDIT_ACTIONS.USER_SUSPENDED,
            resourceType: 'user',
            resourceId: user.id,
            metadata: {
                targetName: existing.name,
                targetEmail: existing.email,
                before: { isActive: existing.isActive },
                after: { isActive: user.isActive },
            },
            request: req,
        });
    }

    return NextResponse.json({ user });
}
