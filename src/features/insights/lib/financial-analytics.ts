import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { getBudgetUsage } from '@/lib/budgets/budgets';
import { getCategoryTotals, getPeriodTotals, round2, type Totals } from '@/lib/finance/totals';
import { getWorkspaceSettings } from '@/lib/settings/server';
import { cleanText } from './text';

const DAY_MS = 86_400_000;
const MAX_BUDGET_SPAN_DAYS = 32; // getBudgetUsage is built for one month

export type AnalyticsRange = { from: Date; to: Date; prevFrom: Date; prevTo: Date };

export type FinancialAnalytics = {
    currency: string;
    period: { from: string; to: string; days: number };
    current: Totals;
    previous: Totals;
    change: { incomePct: number | null; expensePct: number | null; netChange: number };
    categories: {
        name: string;
        expense: number;
        previousExpense: number;
        sharePct: number;
        changeAmount: number;
        changePct: number | null;
    }[];
    largestExpenses: { amount: number; description: string; category: string }[];
    expenseCount: number;
    averageExpense: number;
    recurringExpenses: { description: string; monthlyAmount: number; frequency: string }[];
    recurringMonthlyTotal: number;
    budgets:
    | {
        categoryName: string;
        limit: number;
        spent: number;
        percentUsed: number;
        isOverBudget: boolean;
    }[]
    | null;
    budgetWarningPercent: number;
};

const pct = (cur: number, prev: number) => (prev > 0 ? round2(((cur - prev) / prev) * 100) : null);
const FREQ_TO_MONTHLY = { WEEKLY: 52 / 12, MONTHLY: 1, YEARLY: 1 / 12 } as const;

export async function getFinancialAnalytics(
    workspaceId: string,
    range: AnalyticsRange,
): Promise<FinancialAnalytics> {
    const { from, to, prevFrom, prevTo } = range;
    const cur = { gte: from, lt: to };
    const prev = { gte: prevFrom, lt: prevTo };
    const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS));
    const debitWhere = { workspaceId, type: 'DEBIT' as const, createdAt: cur };

    const [
        workspace,
        settings,
        current,
        previous,
        catCur,
        catPrev,
        largest,
        expenseAgg,
        recurring,
        budgetData,
    ] = await Promise.all([
        prisma.workspace.findUnique({ where: { id: workspaceId }, select: { currency: true } }),
        getWorkspaceSettings(workspaceId),
        getPeriodTotals(workspaceId, null, cur),
        getPeriodTotals(workspaceId, null, prev),
        getCategoryTotals(workspaceId, cur),
        getCategoryTotals(workspaceId, prev),
        prisma.transaction.findMany({
            where: debitWhere,
            orderBy: { amount: 'desc' },
            take: 5,
            select: { amount: true, description: true, category: { select: { name: true } } },
        }),
        prisma.transaction.aggregate({
            where: debitWhere,
            _avg: { amount: true },
            _count: { _all: true },
        }),
        prisma.recurringTransaction.findMany({
            where: { workspaceId, isActive: true, type: 'DEBIT' },
            take: 20,
            orderBy: { amount: 'desc' },
            select: { description: true, amount: true, frequency: true },
        }),
        spanDays <= MAX_BUDGET_SPAN_DAYS ? getBudgetUsage(workspaceId, from, to) : null,
    ]);

    const prevExpenseByCat = new Map(catPrev.map((c) => [c.categoryId, c.expense]));
    const categories = catCur
        .filter((c) => c.expense > 0)
        .sort((a, b) => b.expense - a.expense)
        .slice(0, 8)
        .map((c) => {
            const previousExpense = prevExpenseByCat.get(c.categoryId) ?? 0;
            return {
                name: cleanText(c.name),
                expense: c.expense,
                previousExpense,
                sharePct: current.expense > 0 ? round2((c.expense / current.expense) * 100) : 0,
                changeAmount: round2(c.expense - previousExpense),
                changePct: pct(c.expense, previousExpense),
            };
        });

    const recurringExpenses = recurring.map((r) => ({
        description: cleanText(r.description) || 'Untitled',
        monthlyAmount: round2(r.amount * FREQ_TO_MONTHLY[r.frequency]),
        frequency: r.frequency,
    }));

    return {
        currency: workspace?.currency ?? 'INR',
        period: { from: from.toISOString(), to: to.toISOString(), days: spanDays },
        current,
        previous,
        change: {
            incomePct: pct(current.income, previous.income),
            expensePct: pct(current.expense, previous.expense),
            netChange: round2(current.net - previous.net),
        },
        categories,
        largestExpenses: largest.map((t) => ({
            amount: t.amount,
            description: cleanText(t.description),
            category: cleanText(t.category?.name) || 'Uncategorized',
        })),
        expenseCount: expenseAgg._count._all,
        averageExpense: round2(expenseAgg._avg.amount ?? 0),
        recurringExpenses,
        recurringMonthlyTotal: round2(recurringExpenses.reduce((s, r) => s + r.monthlyAmount, 0)),
        budgets: budgetData
            ? budgetData.budgets.map((b) => ({
                categoryName: cleanText(b.category.name),
                limit: b.amount,
                spent: b.spent,
                percentUsed: b.percentUsed,
                isOverBudget: b.isOverBudget,
            }))
            : null,
        budgetWarningPercent: Number(settings['finance.budgetWarningPercent'] ?? 80),
    };
}