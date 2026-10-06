import { prisma } from '@/lib/db/prisma';

export const MAX_BUDGET_AMOUNT = 1_000_000_000;
const MAX_PERIOD_DAYS = 32;

const round2 = (n: number) => Math.round(n * 100) / 100;

export type BudgetUsage = {
    id: string;
    categoryId: string;
    category: { id: string; name: string; color: string | null; isActive: boolean };
    period: 'MONTHLY';
    amount: number;
    startDate: Date;
    endDate: Date | null;
    spent: number;
    remaining: number; // signed: negative when over budget
    percentUsed: number; // not clamped, 120 means 120%
    isOverBudget: boolean;
};

export type BudgetTotals = {
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    isOverBudget: boolean;
};

export function validateAmount(value: unknown): { amount: number } | { error: string } {
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) return { error: 'Amount must be a number' };
    if (n <= 0) return { error: 'Amount must be greater than 0' };
    if (n > MAX_BUDGET_AMOUNT) return { error: 'Amount is too large' };
    return { amount: round2(n) };
}

function currentMonthUtc() {
    const now = new Date();
    return {
        from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
}

/** from inclusive, to exclusive. Defaults to the current month. */
export function parsePeriod(params: URLSearchParams): { from: Date; to: Date } | { error: string } {
    const fromRaw = params.get('from');
    const toRaw = params.get('to');
    if (!fromRaw && !toRaw) return currentMonthUtc();
    if (!fromRaw || !toRaw) return { error: 'Both from and to are required' };

    const from = new Date(fromRaw);
    const to = new Date(toRaw);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()))
        return { error: 'Invalid date range' };
    if (to <= from) return { error: '"to" must be after "from"' };
    if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_PERIOD_DAYS) {
        return { error: 'Period must be a single month' };
    }
    return { from, to };
}

// Browsers send their local month start as a UTC instant, which can be up to 14h
// earlier than the UTC month start (e.g. IST sends Sep 30 18:30Z for "Oct 1").
const MAX_TZ_OFFSET_MS = 14 * 60 * 60 * 1000;

export function isBeforeCurrentMonth(date: Date, now: Date = new Date()): boolean {
    const floor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - MAX_TZ_OFFSET_MS;
    return date.getTime() < floor;
}

export function parseStartDate(value: unknown): { startDate: Date } | { error: string } {
    if (value === undefined || value === null || value === '') {
        return { startDate: currentMonthUtc().from };
    }
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return { error: 'Invalid start date' };
    if (isBeforeCurrentMonth(d)) return { error: 'Budgets cannot be created for past months' };
    return { startDate: d };
}

export function buildUsage(
    budget: Omit<BudgetUsage, 'spent' | 'remaining' | 'percentUsed' | 'isOverBudget'>,
    spentRaw: number,
): BudgetUsage {
    const spent = round2(spentRaw);
    return {
        ...budget,
        spent,
        remaining: round2(budget.amount - spent),
        percentUsed: budget.amount > 0 ? Math.round((spent / budget.amount) * 10000) / 100 : 0,
        isOverBudget: spent > budget.amount,
    };
}

export async function getBudgetUsage(workspaceId: string, from: Date, to: Date) {
    const rows = await prisma.budget.findMany({
        where: {
            workspaceId,
            isActive: true,
            startDate: { lt: to },
            OR: [{ endDate: null }, { endDate: { gte: from } }],
        },
        include: { category: { select: { id: true, name: true, color: true, isActive: true } } },
        orderBy: { createdAt: 'asc' },
    });

    const spentByCategory = new Map<string, number>();
    if (rows.length > 0) {
        const grouped = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: {
                workspaceId, // never trust category alone
                type: 'DEBIT',
                categoryId: { in: rows.map((r) => r.categoryId) },
                createdAt: { gte: from, lt: to },
            },
            _sum: { amount: true },
        });
        for (const g of grouped) {
            if (g.categoryId) spentByCategory.set(g.categoryId, g._sum.amount ?? 0);
        }
    }

    const budgets = rows.map((r) =>
        buildUsage(
            {
                id: r.id,
                categoryId: r.categoryId,
                category: r.category,
                period: r.period as 'MONTHLY',
                amount: r.amount,
                startDate: r.startDate,
                endDate: r.endDate,
            },
            spentByCategory.get(r.categoryId) ?? 0,
        ),
    );

    const budgeted = round2(budgets.reduce((s, b) => s + b.amount, 0));
    const spent = round2(budgets.reduce((s, b) => s + b.spent, 0));
    const totals: BudgetTotals = {
        budgeted,
        spent,
        remaining: round2(budgeted - spent),
        percentUsed: budgeted > 0 ? Math.round((spent / budgeted) * 10000) / 100 : 0,
        isOverBudget: spent > budgeted,
    };

    return { budgets, totals };
}
