import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';                 // ASSUMPTION: your Prisma client path
import { requireUserId } from '@/lib/auth/auth';            // ASSUMPTION
import { sendTicketCreatedEmail } from '@/lib/email';  // ASSUMPTION
import { SUBJECT_MAX, MESSAGE_MAX } from '@/features/support-tickets/status';
import type { Prisma } from '@/generated/prisma';
import { isTicketStatus } from '@/features/support-tickets/status';

const SORTABLE = ['createdAt', 'updatedAt', 'status', 'subject'] as const;

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit')) || 10));
  const sortByRaw = sp.get('sortBy') ?? 'createdAt';
  const sortBy = (SORTABLE as readonly string[]).includes(sortByRaw) ? sortByRaw : 'createdAt';
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const search = sp.get('search')?.trim();
  const statusRaw = sp.get('status');

  if (statusRaw && !isTicketStatus(statusRaw))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const where: Prisma.SupportTicketWhereInput = {
    userId, // always scoped to the signed-in user
    ...(statusRaw ? { status: statusRaw } : {}),
    ...(search ? { OR: [
      { subject: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ] } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, subject: true, message: true, status: true,
        createdAt: true, updatedAt: true, processingAt: true, resolvedAt: true },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return NextResponse.json({
    data: rows,
    pagination: { page, limit, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limit)), hasMore: page * limit < totalCount },
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!subject || subject.length > SUBJECT_MAX)
    return NextResponse.json({ error: `Subject is required (max ${SUBJECT_MAX} characters)` }, { status: 400 });
  if (!message || message.length > MESSAGE_MAX)
    return NextResponse.json({ error: `Message is required (max ${MESSAGE_MAX} characters)` }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: { userId, subject, message },
    include: { user: { select: { email: true, name: true } } },
  });

  // Best-effort: a mail failure must not fail ticket creation.
  try {
    await sendTicketCreatedEmail({
      to: ticket.user.email,
      name: ticket.user.name,
      ticketId: ticket.id,
      subject,
      message,
    });
    const supportInbox = process.env.SUPPORT_TICKET_INBOX; // optional
    if (supportInbox) {
      await sendTicketCreatedEmail({ to: supportInbox, name: null, ticketId: ticket.id, subject, message });
    }
  } catch (e) {
    console.error('[support-tickets] created email failed', e);
  }

  return NextResponse.json(
    { ticket: { id: ticket.id, subject, status: ticket.status, createdAt: ticket.createdAt } },
    { status: 201 },
  );
}