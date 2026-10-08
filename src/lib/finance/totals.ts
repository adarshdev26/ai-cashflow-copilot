import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { visibleCategoryWhere } from '@/lib/categories';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';

export type Totals = { income: number; expense: number; net: number; count: number };
export type CategoryTotals = {
    categoryId: string;
    name: string;
    color: string | null;
    income: number;
    expense: number;
    net: number;
    count: number;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getPeriodTotals(
    workspaceId: string,
    accountId: string | null,
    range?: { gte: Date; lt: Date },
): Promise<Totals> {
    const rows = await prisma.transaction.groupBy({
        by: ['type'],
        where: {
            workspaceId,
            type: { in: FINANCIAL_TYPES },
            ...(accountId ? { accountId } : {}),
            ...(range ? { createdAt: range } : {}),
        },
        _sum: { amount: true },
        _count: { _all: true },
    });

    let income = 0;
    let expense = 0;
    let count = 0;
    for (const row of rows) {
        const sum = row._sum.amount ?? 0;
        count += row._count._all;
        if (row.type === 'CREDIT') income += sum;
        else expense += sum;
    }
    return {
        income: round2(income),
        expense: round2(expense),
        net: round2(income - expense),
        count,
    };
}

export async function getCategoryTotals(
    workspaceId: string,
    range: { gte?: Date; lt?: Date } = {},
): Promise<CategoryTotals[]> {
    const { gte, lt } = range;
    const dateFilter =
        gte || lt ? { createdAt: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } } : {};

    const [categories, rows] = await Promise.all([
        prisma.category.findMany({
            where: visibleCategoryWhere(workspaceId),
            orderBy: { name: 'asc' },
            select: { id: true, name: true, color: true },
        }),
        prisma.transaction.groupBy({
            by: ['categoryId', 'type'],
            where: { workspaceId, type: { in: FINANCIAL_TYPES }, ...dateFilter },
            _sum: { amount: true },
            _count: { _all: true },
        }),
    ]);

    const totals = new Map<string, CategoryTotals>();
    for (const c of categories) {
        totals.set(c.id, {
            categoryId: c.id,
            name: c.name,
            color: c.color,
            income: 0,
            expense: 0,
            net: 0,
            count: 0,
        });
    }
    for (const row of rows) {
        if (!row.categoryId) continue;
        let entry = totals.get(row.categoryId);
        if (!entry) {
            entry = {
                categoryId: row.categoryId,
                name: 'Uncategorized',
                color: null,
                income: 0,
                expense: 0,
                net: 0,
                count: 0,
            };
            totals.set(row.categoryId, entry);
        }
        const sum = row._sum.amount ?? 0;
        entry.count += row._count._all;
        if (row.type === 'CREDIT') entry.income += sum;
        else entry.expense += sum;
    }

    return Array.from(totals.values())
        .filter((c) => c.count > 0)
        .map((c) => ({
            ...c,
            income: round2(c.income),
            expense: round2(c.expense),
            net: round2(c.income - c.expense),
        }))
        .sort((a, b) => b.count - a.count);
}