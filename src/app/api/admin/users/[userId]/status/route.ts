import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;
    const body = await req.json().catch(() => null);
    if (typeof body?.isActive !== 'boolean')
        return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: body.isActive },
        select: { id: true, isActive: true },
    });
    return NextResponse.json({ user });
}
