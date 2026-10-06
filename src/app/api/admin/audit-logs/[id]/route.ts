import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const { id } = await params;
    const event = await prisma.auditLog.findUnique({
        where: { id },
        select: {
            id: true,
            createdAt: true,
            actorId: true,
            actorType: true,
            actorName: true,
            actorEmail: true,
            action: true,
            resourceType: true,
            resourceId: true,
            workspaceId: true,
            metadata: true,
            ip: true,
            userAgent: true,
        },
    });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ event });
}
