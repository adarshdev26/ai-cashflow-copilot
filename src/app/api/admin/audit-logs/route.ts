import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import { getSystemNumber } from '@/lib/settings/server';

const TOKEN_RE = /^[a-z0-9_.-]{1,64}$/i;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** Date-only values (YYYY-MM-DD) are treated as UTC; `dateTo` is inclusive of the whole day. */
function parseDate(raw: string | null, endOfDay: boolean): Date | undefined {
    if (!raw) return undefined;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const d = new Date(dateOnly ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

export const AUDIT_ROW_SELECT = {
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
} satisfies Prisma.AuditLogSelect;

export async function GET(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const url = new URL(req.url);
    const p = parseListParams(
        url,
        ['createdAt'],
        'createdAt',
        await getSystemNumber('limits.listMaxPageSize'),
    );

    const sp = url.searchParams;
    const action = sp.get('action');
    const resourceType = sp.get('resourceType');
    const actorId = sp.get('actorId');
    const resourceId = sp.get('resourceId');
    const dateFrom = parseDate(sp.get('dateFrom'), false);
    const dateTo = parseDate(sp.get('dateTo'), true);

    const where: Prisma.AuditLogWhereInput = {
        ...(action && TOKEN_RE.test(action) ? { action } : {}),
        ...(resourceType && TOKEN_RE.test(resourceType) ? { resourceType } : {}),
        ...(actorId && ID_RE.test(actorId) ? { actorId } : {}),
        ...(resourceId && ID_RE.test(resourceId) ? { resourceId } : {}),
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
                      { actorName: { contains: p.search, mode: 'insensitive' } },
                      { actorEmail: { contains: p.search, mode: 'insensitive' } },
                      { resourceId: { contains: p.search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [rows, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            select: AUDIT_ROW_SELECT,
            // id is the tie-breaker so pages stay stable when timestamps collide
            orderBy: [{ createdAt: p.sortDir }, { id: p.sortDir }],
            skip: p.skip,
            take: p.limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
        data: rows,
        pagination: paginationMeta(p.page, p.limit, totalCount),
    });
}
