import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ ticketId: string }> }, // Next 14: params is not a Promise, drop await
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { ticketId } = await params;
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json({ ticket });
}
