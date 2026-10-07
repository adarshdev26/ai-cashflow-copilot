import 'server-only';

import { prisma } from '@/lib/db/prisma';
import { getBudgetUsage } from '@/lib/budgets/budgets';
import { calcBalance, getAccountTotals } from '@/features/accounts/lib/balance';
import { monthlyEquivalent } from '@/features/recurring/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

const DEFAULT_TOP_EXPENSES = 10;

export type FinancialAnalyticsPeriod = {
    income: number;
    expenses: number;
    netCashFlow: number;
};

export type FinancialAnalyticsComparison = {
    incomeChangePercent: number | null;
    expenseChangePercent: number | null;
    netCashFlowChangePercent: number | null;
};

export type FinancialAnalyticsCategoryChange = {
    categoryId: string | null;
    categoryName: string;
    currentAmount: number;
    previousAmount: number;
    absoluteChange: number;
    changePercent: number | null;
};

export type FinancialAnalyticsTopExpense = {
    transactionId: string;
    description: string;
    amount: number;
    date: string;
    categoryName: string | null;
    accountName: string | null;
};

export type FinancialAnalyticsBudget = {
    budgetId: string;
    categoryId: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    isExceeded: boolean;
};

export type FinancialAnalyticsAccountBalance = {
    accountId: string;
    accountName: string;
    balance: number;
    currency: string;
};

export type FinancialAnalyticsResult = {
    currentPeriod: FinancialAnalyticsPeriod;
    previousPeriod: FinancialAnalyticsPeriod;
    comparison: FinancialAnalyticsComparison;
    categoryChanges: FinancialAnalyticsCategoryChange[];
    topExpenses: FinancialAnalyticsTopExpense[];
    recurringExpenses: { monthlyTotal: number };
    budgets: FinancialAnalyticsBudget[];
    accountBalances: FinancialAnalyticsAccountBalance[];
};

export type FinancialAnalyticsParams = {
    /** Must already be authorized by the caller. Never taken from untrusted client input alone. */
    workspaceId: string;
    /** Inclusive period start. */
    from: Date;
    /** Exclusive period end. */
    to: Date;
    /** Largest expense transactions to return. Defaults to 10. */
    topExpensesLimit?: number;
};

/** Percent change vs previous. `null` when previous is 0 (avoids Infinity / NaN). */
export function percentChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    const value = ((current - previous) / Math.abs(previous)) * 100;
    if (!Number.isFinite(value)) return null;
    return round2(value);
}

function previousRange(from: Date, to: Date): { from: Date; to: Date } {
    const durationMs = to.getTime() - from.getTime();
    return {
        from: new Date(from.getTime() - durationMs),
        to: new Date(from.getTime()),
    };
}

async function periodTotals(
    workspaceId: string,
    from: Date,
    to: Date,
): Promise<FinancialAnalyticsPeriod> {
    const rows = await prisma.transaction.groupBy({
        by: ['type'],
        where: {
            workspaceId,
            createdAt: { gte: from, lt: to },
        },
        _sum: { amount: true },
    });

    let income = 0;
    let expenses = 0;
    for (const row of rows) {
        const sum = row._sum.amount ?? 0;
        if (row.type === 'CREDIT') income += sum;
        else expenses += sum;
    }

    income = round2(income);
    expenses = round2(expenses);
    return {
        income,
        expenses,
        netCashFlow: round2(income - expenses),
    };
}

async function debitByCategory(
    workspaceId: string,
    from: Date,
    to: Date,
): Promise<Map<string | null, number>> {
    const rows = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
            workspaceId,
            type: 'DEBIT',
            createdAt: { gte: from, lt: to },
        },
        _sum: { amount: true },
    });

    const map = new Map<string | null, number>();
    for (const row of rows) {
        map.set(row.categoryId, round2(row._sum.amount ?? 0));
    }
    return map;
}

/**
 * Workspace-scoped financial analytics for a date range.
 * Authorization is the caller's responsibility — pass a workspaceId already verified
 * via requireWorkspaceAccess / requireWorkspaceAction (or equivalent).
 */
export async function getFinancialAnalytics(
    params: FinancialAnalyticsParams,
): Promise<FinancialAnalyticsResult> {
    const { workspaceId, from, to } = params;
    const topLimit =
        typeof params.topExpensesLimit === 'number' &&
        Number.isFinite(params.topExpensesLimit) &&
        params.topExpensesLimit > 0
            ? Math.floor(params.topExpensesLimit)
            : DEFAULT_TOP_EXPENSES;

    if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
        throw new Error('Invalid analytics period start');
    }
    if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
        throw new Error('Invalid analytics period end');
    }
    if (to <= from) {
        throw new Error('Analytics period end must be after start');
    }

    const previous = previousRange(from, to);

    const [
        currentPeriod,
        previousPeriod,
        currentByCategory,
        previousByCategory,
        topRows,
        recurringRows,
        budgetUsage,
        accounts,
    ] = await Promise.all([
        periodTotals(workspaceId, from, to),
        periodTotals(workspaceId, previous.from, previous.to),
        debitByCategory(workspaceId, from, to),
        debitByCategory(workspaceId, previous.from, previous.to),
        prisma.transaction.findMany({
            where: {
                workspaceId,
                type: 'DEBIT',
                createdAt: { gte: from, lt: to },
            },
            orderBy: [{ amount: 'desc' }, { createdAt: 'desc' }],
            take: topLimit,
            select: {
                id: true,
                description: true,
                amount: true,
                createdAt: true,
                category: { select: { name: true } },
                account: { select: { name: true } },
            },
        }),
        prisma.recurringTransaction.findMany({
            where: {
                workspaceId,
                isActive: true,
                type: 'DEBIT',
            },
            select: { amount: true, frequency: true },
        }),
        getBudgetUsage(workspaceId, from, to),
        prisma.financialAccount.findMany({
            where: { workspaceId, isActive: true },
            select: {
                id: true,
                name: true,
                currency: true,
                openingBalance: true,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    const categoryIds = [
        ...new Set(
            [...currentByCategory.keys(), ...previousByCategory.keys()].filter(
                (id): id is string => id !== null,
            ),
        ),
    ];
    const categories =
        categoryIds.length > 0
            ? await prisma.category.findMany({
                  where: { id: { in: categoryIds } },
                  select: { id: true, name: true },
              })
            : [];
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    const allCategoryKeys = new Set<string | null>([
        ...currentByCategory.keys(),
        ...previousByCategory.keys(),
    ]);
    const categoryChanges: FinancialAnalyticsCategoryChange[] = [...allCategoryKeys]
        .map((categoryId) => {
            const currentAmount = currentByCategory.get(categoryId) ?? 0;
            const previousAmount = previousByCategory.get(categoryId) ?? 0;
            return {
                categoryId,
                categoryName:
                    categoryId === null
                        ? 'Uncategorized'
                        : (categoryNameById.get(categoryId) ?? 'Unknown'),
                currentAmount,
                previousAmount,
                absoluteChange: round2(currentAmount - previousAmount),
                changePercent: percentChange(currentAmount, previousAmount),
            };
        })
        .sort((a, b) => b.currentAmount - a.currentAmount);

    const accountTotals = await getAccountTotals(
        workspaceId,
        accounts.map((a) => a.id),
    );

    const monthlyTotal = round2(
        recurringRows.reduce((sum, row) => sum + monthlyEquivalent(row), 0),
    );

    return {
        currentPeriod,
        previousPeriod,
        comparison: {
            incomeChangePercent: percentChange(currentPeriod.income, previousPeriod.income),
            expenseChangePercent: percentChange(currentPeriod.expenses, previousPeriod.expenses),
            netCashFlowChangePercent: percentChange(
                currentPeriod.netCashFlow,
                previousPeriod.netCashFlow,
            ),
        },
        categoryChanges,
        topExpenses: topRows.map((row) => ({
            transactionId: row.id,
            description: row.description ?? '',
            amount: round2(row.amount),
            date: row.createdAt.toISOString(),
            categoryName: row.category?.name ?? null,
            accountName: row.account?.name ?? null,
        })),
        recurringExpenses: { monthlyTotal },
        budgets: budgetUsage.budgets.map((b) => ({
            budgetId: b.id,
            categoryId: b.categoryId,
            categoryName: b.category.name,
            budgetAmount: b.amount,
            spentAmount: b.spent,
            remainingAmount: b.remaining,
            percentageUsed: b.percentUsed,
            isExceeded: b.isOverBudget,
        })),
        accountBalances: accounts.map((account) => {
            const totals = accountTotals.get(account.id) ?? { credit: 0, debit: 0 };
            return {
                accountId: account.id,
                accountName: account.name,
                balance: calcBalance(account.openingBalance, totals.credit, totals.debit),
                currency: account.currency,
            };
        }),
    };
}
