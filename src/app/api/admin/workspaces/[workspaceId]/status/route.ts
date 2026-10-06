import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';

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
        select: { id: true },
    });
    if (!exists) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: { isActive: body.isActive },
        select: { id: true, isActive: true },
    });
    return NextResponse.json({ workspace });
}
