import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { sendTicketStatusEmail } from '@/lib/email';
import { canTransition, isTicketStatus } from '@/features/support-tickets/status';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function PATCH(req: Request, { params }: { params: Promise<{ ticketId: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { ticketId } = await params;
    const body = await req.json().catch(() => null);
    const next = body?.status;

    if (!isTicketStatus(next) || next === 'PENDING')
        return NextResponse.json(
            { error: 'Status must be PROCESSING or RESOLVED' },
            { status: 400 },
        );

    const current = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { status: true, subject: true },
    });
    if (!current) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    if (!canTransition(current.status, next))
        return NextResponse.json(
            { error: `Cannot move ticket from ${current.status} to ${next}` },
            { status: 409 },
        );

    const now = new Date();
    const { count } = await prisma.supportTicket.updateMany({
        where: { id: ticketId, status: current.status }, // optimistic lock against concurrent admins
        data: {
            status: next,
            ...(next === 'PROCESSING' ? { processingAt: now } : {}),
            ...(next === 'RESOLVED' ? { resolvedAt: now } : {}),
        },
    });
    if (count === 0)
        return NextResponse.json(
            { error: 'Ticket was changed by someone else. Reload and retry.' },
            { status: 409 },
        );

    const ticket = await prisma.supportTicket.findUniqueOrThrow({
        where: { id: ticketId },
        include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAudit({
        actor: await adminActor(guard.adminId),
        action: AUDIT_ACTIONS.SUPPORT_TICKET_STATUS_CHANGED,
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        metadata: {
            targetName: ticket.subject,
            targetEmail: ticket.user.email,
            before: { status: current.status },
            after: { status: ticket.status },
        },
        request: req,
    });

    try {
        await sendTicketStatusEmail({
            to: ticket.user.email,
            name: ticket.user.name,
            ticketId: ticket.id,
            subject: ticket.subject,
            status: next,
        });
    } catch (e) {
        console.error('[support-tickets] status email failed', e);
    }

    return NextResponse.json({ ticket });
}
