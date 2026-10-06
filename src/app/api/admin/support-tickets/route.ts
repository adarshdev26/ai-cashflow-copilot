import { NextResponse } from 'next/server';
import type { Prisma, SupportTicketStatus } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { isTicketStatus } from '@/features/support-tickets/status';

const SORTABLE = ['createdAt', 'updatedAt', 'status', 'subject'] as const;

export async function GET(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

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
        ...(statusRaw ? { status: statusRaw as SupportTicketStatus } : {}),
        ...(search
            ? {
                  OR: [
                      { subject: { contains: search, mode: 'insensitive' } },
                      { user: { email: { contains: search, mode: 'insensitive' } } },
                      { user: { name: { contains: search, mode: 'insensitive' } } },
                  ],
              }
            : {}),
    };

    const [rows, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            orderBy: { [sortBy]: sortDir },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                subject: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
        data: rows,
        pagination: {
            page,
            limit,
            totalCount: total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasMore: page * limit < total,
        },
    });
}
