import { prisma } from '@/lib/db/prisma';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';
import { listOccurrencesInWindow, toScheduleDate } from '@/lib/recurring/recurring-dates';
import { toGoalView } from '@/features/goals/lib/goals';
import { localDateKey, localDayStart } from '@/features/reports/lib/report-filters';
import type { CalendarEvent, CalendarMonthResponse } from '../types';
import {
    addDaysKey,
    budgetAppliesToMonth,
    gridRange,
    parseMonthKey,
    utcDateKey,
} from './calendar-dates';
import { buildCalendarDays, cashDelta, round2, type CalendarEntry } from './calendar-build';
import type { CalendarParams } from './validate-calendar';

const WEEK_STARTS_ON = 1; // Monday
const MAX_POSTED = 2000;
const MAX_SCHEDULES = 200;
const MAX_OCCURRENCES_PER_SCHEDULE = 62;

export type CalendarResult =
    { ok: true; data: CalendarMonthResponse } | { ok: false; status: number; error: string };

/** Combined balance of the given accounts using only transactions dated before `cutoff`. */
async function balanceBefore(
    workspaceId: string,
    accounts: { id: string; openingBalance: number }[],
    cutoff: Date,
): Promise<number> {
    if (accounts.length === 0) return 0;
    const ids = accounts.map((a) => a.id);

    const [rows, outgoing, incoming] = await Promise.all([
        prisma.transaction.groupBy({
            by: ['accountId', 'type'],
            where: {
                workspaceId,
                accountId: { in: ids },
                type: { in: FINANCIAL_TYPES },
                createdAt: { lt: cutoff },
            },
            _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
            by: ['accountId'],
            where: {
                workspaceId,
                accountId: { in: ids },
                type: 'TRANSFER',
                createdAt: { lt: cutoff },
            },
            _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
            by: ['toAccountId'],
            where: {
                workspaceId,
                toAccountId: { in: ids },
                type: 'TRANSFER',
                createdAt: { lt: cutoff },
            },
            _sum: { amount: true },
        }),
    ]);

    let total = accounts.reduce((sum, a) => sum + a.openingBalance, 0);
    for (const row of rows) {
        const amount = row._sum.amount ?? 0;
        total += row.type === 'CREDIT' ? amount : -amount;
    }
    for (const row of outgoing) total -= row._sum.amount ?? 0;
    for (const row of incoming) total += row._sum.amount ?? 0;
    return round2(total);
}

function transactionTitle(t: {
    description: string | null;
    type: string;
    account: { name: string } | null;
    toAccount: { name: string } | null;
    category: { name: string } | null;
}): string {
    const description = t.description?.trim();
    if (description) return description;
    if (t.type === 'TRANSFER') {
        return `${t.account?.name ?? 'Account'} → ${t.toAccount?.name ?? 'Account'}`;
    }
    return t.category?.name ?? (t.type === 'CREDIT' ? 'Income' : 'Expense');
}

export async function loadCalendarMonth(
    workspaceId: string,
    params: CalendarParams,
): Promise<CalendarResult> {
    const { year, month0, monthKey, tz, accountId } = params;

    const grid = gridRange(year, month0, WEEK_STARTS_ON);
    // Schedule, goal and budget dates are calendar days stored at 12:00 UTC.
    const windowStart = toScheduleDate(grid.startKey);
    const windowEnd = toScheduleDate(grid.endKey);
    // Real transactions are instants: use the viewer's local day boundaries.
    const gridStart = localDayStart(grid.startKey, tz);
    const gridEndExclusive = localDayStart(addDaysKey(grid.endKey, 1), tz);

    const [workspace, accounts] = await Promise.all([
        prisma.workspace.findUnique({ where: { id: workspaceId }, select: { currency: true } }),
        prisma.financialAccount.findMany({
            where: { workspaceId, isActive: true, ...(accountId ? { id: accountId } : {}) },
            select: { id: true, openingBalance: true },
        }),
    ]);
    if (!workspace) return { ok: false, status: 404, error: 'Workspace not found' };
    if (accountId && accounts.length === 0) {
        return { ok: false, status: 404, error: 'Account not found' };
    }

    const scope = new Set(accounts.map((a) => a.id));
    const scopeIds = [...scope];

    const [base, posted, schedules, goals, budgets] = await Promise.all([
        balanceBefore(workspaceId, accounts, gridStart),
        prisma.transaction.findMany({
            where: {
                workspaceId,
                createdAt: { gte: gridStart, lt: gridEndExclusive },
                OR: [{ accountId: { in: scopeIds } }, { toAccountId: { in: scopeIds } }],
            },
            select: {
                id: true,
                type: true,
                amount: true,
                description: true,
                accountId: true,
                toAccountId: true,
                createdAt: true,
                recurringTransactionId: true,
                occurrenceDate: true,
                category: { select: { name: true } },
                account: { select: { name: true } },
                toAccount: { select: { name: true } },
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: MAX_POSTED + 1,
        }),
        prisma.recurringTransaction.findMany({
            where: {
                workspaceId,
                isActive: true,
                accountId: { in: scopeIds },
                type: { in: FINANCIAL_TYPES },
                nextRunAt: { lte: windowEnd },
                OR: [{ endDate: null }, { endDate: { gte: windowStart } }],
            },
            select: {
                id: true,
                description: true,
                amount: true,
                type: true,
                frequency: true,
                startDate: true,
                endDate: true,
                nextRunAt: true,
                accountId: true,
                account: { select: { name: true } },
                category: { select: { name: true } },
            },
            orderBy: { nextRunAt: 'asc' },
            take: MAX_SCHEDULES,
        }),
        prisma.goal.findMany({
            where: {
                workspaceId,
                status: 'ACTIVE',
                targetDate: { gte: windowStart, lte: windowEnd },
            },
        }),
        prisma.budget.findMany({
            where: { workspaceId, isActive: true },
            select: {
                id: true,
                amount: true,
                startDate: true,
                endDate: true,
                category: { select: { name: true } },
            },
        }),
    ]);

    const truncated = posted.length > MAX_POSTED;
    const postedRows = posted.slice(0, MAX_POSTED);
    const entries: CalendarEntry[] = [];
    const postedOccurrences = new Set<string>();

    // 1) Posted transactions (past, today and future-dated)
    for (const t of postedRows) {
        if (t.recurringTransactionId && t.occurrenceDate) {
            postedOccurrences.add(`${t.recurringTransactionId}|${utcDateKey(t.occurrenceDate)}`);
        }
        const kind = t.type === 'CREDIT' ? 'INCOME' : t.type === 'DEBIT' ? 'EXPENSE' : 'TRANSFER';
        entries.push({
            event: {
                id: `tx-${t.id}`,
                date: localDateKey(t.createdAt, tz),
                kind,
                title: transactionTitle(t),
                amount: t.amount,
                accountName: t.account?.name ?? null,
                toAccountName: t.toAccount?.name ?? null,
                categoryName: t.category?.name ?? null,
                source: 'transaction',
                sourceId: t.id,
                isProjected: false,
                isRecurring: t.recurringTransactionId !== null,
                href: '/dashboard/transactions',
                meta: null,
            },
            delta: cashDelta(
                {
                    type: t.type,
                    amount: t.amount,
                    accountId: t.accountId,
                    toAccountId: t.toAccountId,
                },
                scope,
            ),
        });
    }

    // 2) Recurring occurrences that the cron has not posted yet
    for (const s of schedules) {
        const occurrences = listOccurrencesInWindow({
            startDate: s.startDate,
            frequency: s.frequency,
            nextRunAt: s.nextRunAt,
            endDate: s.endDate,
            windowStart,
            windowEnd,
            limit: MAX_OCCURRENCES_PER_SCHEDULE,
        });
        for (const occurrence of occurrences) {
            const date = utcDateKey(occurrence);
            if (postedOccurrences.has(`${s.id}|${date}`)) continue;
            entries.push({
                event: {
                    id: `schedule-${s.id}-${date}`,
                    date,
                    kind: s.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
                    title: s.description?.trim() || s.category?.name || 'Recurring transaction',
                    amount: s.amount,
                    accountName: s.account.name,
                    toAccountName: null,
                    categoryName: s.category?.name ?? null,
                    source: 'schedule',
                    sourceId: s.id,
                    isProjected: true,
                    isRecurring: true,
                    href: '/dashboard/recurring',
                    meta: null,
                },
                delta: cashDelta(
                    {
                        type: s.type,
                        amount: s.amount,
                        accountId: s.accountId,
                        toAccountId: null,
                    },
                    scope,
                ),
            });
        }
    }

    // 3) Goal deadlines (markers, no cash effect)
    for (const goal of goals) {
        const view = toGoalView(goal);
        if (view.displayStatus === 'COMPLETED') continue;
        entries.push({
            event: {
                id: `goal-${goal.id}`,
                date: utcDateKey(goal.targetDate),
                kind: 'GOAL_DEADLINE',
                title: goal.name,
                amount: null,
                accountName: null,
                toAccountName: null,
                categoryName: null,
                source: 'goal',
                sourceId: goal.id,
                isProjected: false,
                isRecurring: false,
                href: '/dashboard/goals',
                meta: {
                    remainingAmount: view.remainingAmount,
                    percentageCompleted: view.percentageCompleted,
                    requiredMonthlyContribution: view.requiredMonthlyContribution,
                },
            },
            delta: 0,
        });
    }

    // 4) Budget periods (start and end markers for every month shown in the grid)
    const monthKeys = [...new Set(grid.keys.map((key) => key.slice(0, 7)))];
    for (const mk of monthKeys) {
        const parsedMonth = parseMonthKey(mk);
        if (!parsedMonth) continue;
        const firstKey = `${mk}-01`;
        const lastKey = utcDateKey(new Date(Date.UTC(parsedMonth.year, parsedMonth.month0 + 1, 0)));

        for (const b of budgets) {
            if (
                !budgetAppliesToMonth(b.startDate, b.endDate, parsedMonth.year, parsedMonth.month0)
            ) {
                continue;
            }
            const make = (kind: 'BUDGET_START' | 'BUDGET_END', date: string): CalendarEvent => ({
                id: `budget-${b.id}-${mk}-${kind === 'BUDGET_START' ? 'start' : 'end'}`,
                date,
                kind,
                title: `${b.category.name} budget`,
                amount: null,
                accountName: null,
                toAccountName: null,
                categoryName: b.category.name,
                source: 'budget',
                sourceId: b.id,
                isProjected: false,
                isRecurring: false,
                href: '/dashboard/budgets',
                meta: { budgetAmount: b.amount },
            });
            if (firstKey >= grid.startKey && firstKey <= grid.endKey) {
                entries.push({ event: make('BUDGET_START', firstKey), delta: 0 });
            }
            if (lastKey >= grid.startKey && lastKey <= grid.endKey) {
                entries.push({ event: make('BUDGET_END', lastKey), delta: 0 });
            }
        }
    }

    const now = new Date();
    return {
        ok: true,
        data: {
            month: monthKey,
            currency: workspace.currency,
            asOf: now.toISOString(),
            today: localDateKey(now, tz),
            gridStart: grid.startKey,
            gridEnd: grid.endKey,
            weekStartsOn: WEEK_STARTS_ON,
            accountId: accountId ?? null,
            truncated,
            days: buildCalendarDays(grid.keys, base, entries),
        },
    };
}
