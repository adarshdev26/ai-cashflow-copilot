import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { getBudgetUsage } from '@/lib/budgets/budgets';
import { getPeriodTotals, round2 } from '@/lib/finance/totals';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';
import type { ChatContext } from '../types';
import { cleanText } from './text';

const DAY_MS = 86_400_000;
const CONTEXT_DAYS = 30;
const MAX_TRANSACTIONS = 15;
const MAX_GOALS = 8;

function monthWindow(now: Date) {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { from, to };
}

export async function getChatContext(workspaceId: string, now = new Date()): Promise<ChatContext> {
    const { from, to } = monthWindow(now);
    const recentFrom = new Date(now.getTime() - CONTEXT_DAYS * DAY_MS);

    const [workspace, totals, transactions, budgets, goals] = await Promise.all([
        prisma.workspace.findUnique({ where: { id: workspaceId }, select: { currency: true } }),
        getPeriodTotals(workspaceId, null, { gte: from, lt: to }),
        prisma.transaction.findMany({
            where: {
                workspaceId,
                type: { in: FINANCIAL_TYPES },
                createdAt: { gte: recentFrom, lt: now },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            take: MAX_TRANSACTIONS,
            select: {
                amount: true,
                type: true,
                description: true,
                createdAt: true,
                category: { select: { name: true } },
            },
        }),
        getBudgetUsage(workspaceId, from, to),
        prisma.goal.findMany({
            where: { workspaceId, status: 'ACTIVE' },
            orderBy: [{ targetDate: 'asc' }, { id: 'asc' }],
            take: MAX_GOALS,
            select: {
                name: true,
                targetAmount: true,
                currentAmount: true,
                targetDate: true,
            },
        }),
    ]);

    return {
        currency: workspace?.currency ?? 'INR',
        period: { from: from.toISOString(), to: to.toISOString() },
        totals: {
            income: totals.income,
            expense: totals.expense,
            net: totals.net,
            count: totals.count,
        },
        recentTransactions: transactions.map((tx) => ({
            date: tx.createdAt.toISOString().slice(0, 10),
            type: tx.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
            amount: round2(tx.amount),
            description: cleanText(tx.description) || 'Untitled',
            category: cleanText(tx.category?.name) || 'Uncategorized',
        })),
        budgets: budgets.budgets.map((budget) => ({
            categoryName: cleanText(budget.category.name) || 'Uncategorized',
            limit: round2(budget.amount),
            spent: round2(budget.spent),
            percentUsed: round2(budget.percentUsed),
            isOverBudget: budget.isOverBudget,
        })),
        goals: goals.map((goal) => ({
            name: cleanText(goal.name) || 'Untitled',
            targetAmount: round2(goal.targetAmount),
            currentAmount: round2(goal.currentAmount),
            remaining: round2(Math.max(0, goal.targetAmount - goal.currentAmount)),
            targetDate: goal.targetDate.toISOString().slice(0, 10),
        })),
    };
}
