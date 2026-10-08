import type { InsightCandidate, InsightSeverity } from '../types';
import type { FinancialAnalytics } from './financial-analytics';

const T = {
    totalIncreasePct: 20,
    categoryIncreasePct: 30,
    minChangeAmount: 500,
    largeVsAverage: 3,
    largeShareOfExpense: 0.1,
    minExpensesForLarge: 5,
    cashFlowChangePct: 25,
    cashFlowMinChange: 1000,
    recurringShareOfIncome: 0.25,
};

const RANK: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };
const cur = (label: string, value: number) => ({ label, value, kind: 'currency' as const });
const per = (label: string, value: number) => ({ label, value, kind: 'percent' as const });
const txt = (label: string, value: string) => ({ label, value, kind: 'text' as const });

export function buildCandidates(a: FinancialAnalytics): InsightCandidate[] {
    const out: Omit<InsightCandidate, 'id'>[] = [];

    // Budget warnings
    for (const b of a.budgets ?? []) {
        if (b.percentUsed < a.budgetWarningPercent) continue;
        out.push({
            type: 'BUDGET_WARNING',
            severity: b.isOverBudget ? 'critical' : 'warning',
            evidence: [
                txt('Category', b.categoryName),
                cur('Spent', b.spent),
                cur('Budget', b.limit),
                per('Used', b.percentUsed),
            ],
        });
    }

    // Spending increase: total
    const expensePct = a.change.expensePct;
    if (
        expensePct !== null &&
        expensePct >= T.totalIncreasePct &&
        a.current.expense - a.previous.expense >= T.minChangeAmount
    ) {
        out.push({
            type: 'SPENDING_INCREASE',
            severity: expensePct >= 50 ? 'warning' : 'info',
            evidence: [
                cur('This period', a.current.expense),
                cur('Previous period', a.previous.expense),
                per('Change', expensePct),
            ],
        });
    }

    // Spending increase: top 2 categories
    a.categories
        .filter(
            (c) =>
                c.changePct !== null &&
                c.changePct >= T.categoryIncreasePct &&
                c.changeAmount >= Math.max(T.minChangeAmount, a.current.expense * 0.05),
        )
        .sort((x, y) => y.changeAmount - x.changeAmount)
        .slice(0, 2)
        .forEach((c) =>
            out.push({
                type: 'SPENDING_INCREASE',
                severity: 'info',
                evidence: [
                    txt('Category', c.name),
                    cur('This period', c.expense),
                    cur('Previous period', c.previousExpense),
                    per('Change', c.changePct ?? 0),
                ],
            }),
        );

    // Large expense (top 2)
    if (a.expenseCount >= T.minExpensesForLarge && a.averageExpense > 0) {
        a.largestExpenses
            .slice(0, 2)
            .filter(
                (t) =>
                    t.amount >= a.averageExpense * T.largeVsAverage &&
                    t.amount >= a.current.expense * T.largeShareOfExpense,
            )
            .forEach((t) =>
                out.push({
                    type: 'LARGE_EXPENSE',
                    severity: 'info',
                    evidence: [
                        cur('Amount', t.amount),
                        txt('Category', t.category),
                        ...(t.description ? [txt('Note', t.description)] : []),
                        cur('Average expense', a.averageExpense),
                    ],
                }),
            );
    }

    // Cash flow change
    if (a.previous.count > 0) {
        const { net: curNet } = a.current;
        const { net: prevNet } = a.previous;
        const delta = a.change.netChange;
        const flippedNegative = prevNet >= 0 && curNet < 0;
        const flippedPositive = prevNet < 0 && curNet >= 0;
        const bigMove =
            Math.abs(delta) >= T.cashFlowMinChange &&
            prevNet !== 0 &&
            (Math.abs(delta) / Math.abs(prevNet)) * 100 >= T.cashFlowChangePct;
        if (flippedNegative || flippedPositive || bigMove) {
            out.push({
                type: 'CASH_FLOW_CHANGE',
                severity: curNet < prevNet ? 'warning' : 'info',
                evidence: [
                    cur('Net this period', curNet),
                    cur('Net previous period', prevNet),
                    cur('Income', a.current.income),
                    cur('Expenses', a.current.expense),
                ],
            });
        }
    }

    // Recurring expenses weigh heavily on income
    if (
        a.recurringMonthlyTotal > 0 &&
        a.current.income > 0 &&
        a.recurringMonthlyTotal / a.current.income >= T.recurringShareOfIncome
    ) {
        out.push({
            type: 'RECURRING_EXPENSE',
            severity: 'info',
            evidence: [
                cur('Recurring per month', a.recurringMonthlyTotal),
                cur('Income this period', a.current.income),
                per('Share of income', Math.round((a.recurringMonthlyTotal / a.current.income) * 10000) / 100),
                ...(a.recurringExpenses[0] ? [txt('Largest', a.recurringExpenses[0].description)] : []),
            ],
        });
    }

    return out
        .sort((x, y) => RANK[x.severity] - RANK[y.severity])
        .slice(0, 5)
        .map((c, i) => ({ ...c, id: `c${i + 1}` }));
}