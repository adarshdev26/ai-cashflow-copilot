import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import { getSystemNumber } from '@/lib/settings/server';

// Sortable fields accepted from the query string. `memberCount`, `accountCount`
// and `categoryCount` are not real columns — they are mapped to Prisma relation
// `_count` orderings further down.
const SORT_FIELDS = [
    'createdAt',
    'name',
    'memberCount',
    'accountCount',
    'categoryCount',
] as const;

type SortField = (typeof SORT_FIELDS)[number];

function buildOrderBy(
    sortBy: SortField,
    sortDir: Prisma.SortOrder,
): Prisma.WorkspaceOrderByWithRelationInput {
    switch (sortBy) {
        case 'memberCount':
            return { access: { _count: sortDir } };
        case 'accountCount':
            return { accounts: { _count: sortDir } };
        case 'categoryCount':
            return { categories: { _count: sortDir } };
        default:
            return { [sortBy]: sortDir };
    }
}

export async function GET(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const p = parseListParams(
        new URL(req.url),
        [...SORT_FIELDS],
        'createdAt',
        await getSystemNumber('limits.listMaxPageSize'),
    );

    const where: Prisma.WorkspaceWhereInput = {
        ...(p.isActive !== undefined ? { isActive: p.isActive } : {}),
        ...(p.search
            ? {
                OR: [
                    { name: { contains: p.search, mode: 'insensitive' } },
                    { slug: { contains: p.search, mode: 'insensitive' } },
                    { owner: { email: { contains: p.search, mode: 'insensitive' } } },
                ],
            }
            : {}),
    };

    // Stable secondary sort so pagination doesn't jitter when the primary key
    // (e.g. a count) has ties.
    const orderBy: Prisma.WorkspaceOrderByWithRelationInput[] = [
        buildOrderBy(p.sortBy as SortField, p.sortDir),
        { id: 'asc' },
    ];

    const [rows, totalCount] = await Promise.all([
        prisma.workspace.findMany({
            where,
            select: {
                id: true,
                name: true,
                slug: true,
                currency: true,
                isActive: true,
                createdAt: true,
                owner: { select: { id: true, name: true, email: true } },
                _count: { select: { access: true } },
            },
            orderBy,
            skip: p.skip,
            take: p.limit,
        }),
        prisma.workspace.count({ where }),
    ]);

    // Active accounts / custom categories per workspace, for just the rows on this page.
    const ids = rows.map((r) => r.id);
    const [accountCounts, categoryCounts] = await Promise.all([
        prisma.financialAccount.groupBy({
            by: ['workspaceId'],
            where: { workspaceId: { in: ids }, isActive: true },
            _count: { _all: true },
        }),
        prisma.category.groupBy({
            by: ['workspaceId'],
            where: { workspaceId: { in: ids }, isActive: true },
            _count: { _all: true },
        }),
    ]);
    const accountMap = new Map(accountCounts.map((r) => [r.workspaceId, r._count._all]));
    const categoryMap = new Map(categoryCounts.map((r) => [r.workspaceId, r._count._all]));

    const data = rows.map(({ _count, ...w }) => ({
        ...w,
        memberCount: _count.access,
        accountCount: accountMap.get(w.id) ?? 0,
        categoryCount: categoryMap.get(w.id) ?? 0,
    }));

    return NextResponse.json({ data, pagination: paginationMeta(p.page, p.limit, totalCount) });
}
