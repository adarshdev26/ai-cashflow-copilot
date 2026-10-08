import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import { captureRouteError } from '@/lib/admin/errors';
import { getSystemNumber } from '@/lib/settings/server';

/** Same helper as audit-logs/route.ts: date-only values are UTC, `dateTo` is inclusive. */
function parseDate(raw: string | null, endOfDay: boolean): Date | null | undefined {
    if (!raw) return undefined;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const d = new Date(dateOnly ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : raw);
    if (Number.isNaN(d.getTime())) return null;
    if (dateOnly && d.toISOString().slice(0, 10) !== raw) return null;
    return d;
}

const ERROR_ROW_SELECT = {
    id: true,
    createdAt: true,
    method: true,
    path: true,
    status: true,
    message: true,
    errorName: true,
} satisfies Prisma.ErrorLogSelect;

export async function GET(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    try {
        const url = new URL(req.url);
        const p = parseListParams(
            url,
            ['createdAt', 'status', 'path', 'method'],
            'createdAt',
            await getSystemNumber('limits.listMaxPageSize'),
        );

        const sp = url.searchParams;
        const status = sp.get('status');
        const dateFrom = parseDate(sp.get('dateFrom'), false);
        const dateTo = parseDate(sp.get('dateTo'), true);
        if (dateFrom === null || dateTo === null) {
            return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
        }
        if (dateFrom && dateTo && dateFrom > dateTo) {
            return NextResponse.json({ error: 'dateFrom must be before dateTo' }, { status: 400 });
        }

        const statusWhere: Prisma.ErrorLogWhereInput =
            status === '5xx'
                ? { status: { gte: 500, lt: 600 } }
                : status === '4xx'
                  ? { status: { gte: 400, lt: 500 } }
                  : status === '429'
                    ? { status: 429 }
                    : {};

        const where: Prisma.ErrorLogWhereInput = {
            ...statusWhere,
            ...(dateFrom || dateTo
                ? {
                      createdAt: {
                          ...(dateFrom ? { gte: dateFrom } : {}),
                          ...(dateTo ? { lte: dateTo } : {}),
                      },
                  }
                : {}),
            ...(p.search
                ? {
                      OR: [
                          { path: { contains: p.search, mode: 'insensitive' } },
                          { message: { contains: p.search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        };

        const [rows, totalCount] = await Promise.all([
            prisma.errorLog.findMany({
                where,
                select: ERROR_ROW_SELECT,
                // id is the tie-breaker so pages stay stable when primary values collide
                orderBy: [
                    { [p.sortBy]: p.sortDir } as Prisma.ErrorLogOrderByWithRelationInput,
                    { id: p.sortDir },
                ],
                skip: p.skip,
                take: p.limit,
            }),
            prisma.errorLog.count({ where }),
        ]);

        return NextResponse.json({
            data: rows,
            pagination: paginationMeta(p.page, p.limit, totalCount),
        });
    } catch (error) {
        console.error('System health errors list failed:', error);
        await captureRouteError(req, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
