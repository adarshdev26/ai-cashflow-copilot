import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { NotificationType as PrismaNotificationType } from '@/generated/prisma';
import { getBudgetUsage } from '@/lib/budgets/budgets';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';
import { formatINR } from '@/features/budgets/utils';
import {
    budgetAlerts,
    dueSoonAlerts,
    savingsRate,
    spendingAlert,
    spendingTrend,
    toBudgetRows,
    type AlertSeverity,
} from '@/features/dashboard/utils/dashboard-insights';
import {
    MAX_NOTIFICATION_CANDIDATES,
    goalProximityAlerts,
    isoDay,
    makeKey,
    monthKey,
    savingsImprovement,
    type NotificationCandidate,
} from './notifications';
import type { NotificationDTO } from '../types';

const RANK: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

async function monthTotals(workspaceId: string, gte: Date, lt: Date) {
    const rows = await prisma.transaction.groupBy({
        by: ['type'],
        where: { workspaceId, type: { in: FINANCIAL_TYPES }, createdAt: { gte, lt } },
        _sum: { amount: true },
    });
    let income = 0;
    let expense = 0;
    for (const r of rows) {
        const s = r._sum.amount ?? 0;
        if (r.type === 'CREDIT') income += s;
        else expense += s;
    }
    return { income, expense };
}

/** All notifications that currently apply to the workspace (no per-user state yet). */
export async function loadCandidates(
    workspaceId: string,
    now: Date = new Date(),
    locale = 'en-IN',
): Promise<NotificationCandidate[]> {
    const fmt = (n: number) => formatINR(n, locale);
    const ym = monthKey(now);
    const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [usage, recurring, goals, thisM, lastM] = await Promise.all([
        getBudgetUsage(workspaceId, thisStart, nextStart),
        prisma.recurringTransaction.findMany({
            where: { workspaceId, isActive: true },
            select: { id: true, isActive: true, type: true, amount: true, description: true, nextRunAt: true },
            take: MAX_NOTIFICATION_CANDIDATES,
        }),
        prisma.goal.findMany({
            where: { workspaceId, status: 'ACTIVE' },
            select: { id: true, name: true, targetAmount: true, currentAmount: true, targetDate: true, status: true },
            take: MAX_NOTIFICATION_CANDIDATES,
        }),
        monthTotals(workspaceId, thisStart, nextStart),
        monthTotals(workspaceId, lastStart, thisStart),
    ]);

    const out: NotificationCandidate[] = [];

    // Budgets (existing helper, 1:1)
    for (const a of budgetAlerts(toBudgetRows({ budgets: usage.budgets }), fmt)) {
        const type = a.severity === 'critical' ? 'BUDGET_EXCEEDED' : 'BUDGET_WARN';
        out.push({
            key: makeKey(type, a.id.replace(/^budget-/, ''), ym),
            type,
            severity: a.severity,
            title: a.title,
            description: a.description,
            href: a.href,
        });
    }

    // Recurring due soon: DEBIT and CREDIT
    const nextRun = new Map(recurring.map((r) => [r.id, r.nextRunAt]));
    const pushDue = (types: ('DEBIT' | 'CREDIT')[], type: 'PAYMENT_DUE_SOON' | 'INCOME_EXPECTED') => {
        for (const a of dueSoonAlerts(recurring, fmt, now, types)) {
            const rid = a.id.replace(/^due-/, '');
            out.push({
                key: makeKey(type, rid, isoDay(nextRun.get(rid) ?? now)),
                type,
                severity: a.severity,
                title: a.title,
                description: a.description,
                href: a.href,
            });
        }
    };
    pushDue(['DEBIT'], 'PAYMENT_DUE_SOON');
    pushDue(['CREDIT'], 'INCOME_EXPECTED');

    // Goals
    out.push(...goalProximityAlerts(goals, fmt, now));

    // Spending trend (existing helpers)
    for (const a of spendingAlert(spendingTrend(thisM.expense, lastM.expense, now))) {
        out.push({
            key: makeKey('SPENDING_UP', ym),
            type: 'SPENDING_UP',
            severity: a.severity,
            title: a.title,
            description: a.description,
            href: '/dashboard/transactions',
        });
    }

    // Savings trend
    const thisRate = savingsRate(thisM.income, thisM.income - thisM.expense);
    const lastRate = savingsRate(lastM.income, lastM.income - lastM.expense);
    const gain = savingsImprovement(thisRate, lastRate);
    if (gain != null) {
        out.push({
            key: makeKey('SAVINGS_TREND', ym),
            type: 'SAVINGS_TREND',
            severity: 'info',
            title: 'Your savings are up',
            description: `Savings rate is ${thisRate}% this month, up ${gain} points from last month`,
            href: '/dashboard/reports',
        });
    }

    return out
        .sort((a, b) => RANK[a.severity] - RANK[b.severity])
        .slice(0, MAX_NOTIFICATION_CANDIDATES);
}

/** Candidates merged with this user's read/dismiss state. Dismissed ones are dropped. */
export async function computeNotifications(
    workspaceId: string,
    userId: string,
    now: Date = new Date(),
): Promise<NotificationDTO[]> {
    const candidates = await loadCandidates(workspaceId, now);
    if (candidates.length === 0) return [];

    const states = await prisma.notification.findMany({
        where: { workspaceId, userId, dedupeKey: { in: candidates.map((c) => c.key) } },
        select: { dedupeKey: true, isRead: true, dismissedAt: true },
    });
    const byKey = new Map(states.map((s) => [s.dedupeKey, s]));

    return candidates
        .filter((c) => !byKey.get(c.key)?.dismissedAt)
        .map((c) => ({
            id: c.key,
            type: c.type,
            severity: c.severity,
            title: c.title,
            description: c.description,
            href: c.href,
            isRead: byKey.get(c.key)?.isRead ?? false,
        }));
}

export type NotificationStatePatch = 'read' | 'dismiss';

/** Upserts this user's state for one notification. Returns false if it no longer exists. */
export async function setNotificationState(
    workspaceId: string,
    userId: string,
    key: string,
    action: NotificationStatePatch,
): Promise<boolean> {
    const current = (await loadCandidates(workspaceId)).find((c) => c.key === key);
    if (!current) return false;
    const now = new Date();
    const patch =
        action === 'read' ? { isRead: true, readAt: now } : { isRead: true, readAt: now, dismissedAt: now };
    await prisma.notification.upsert({
        where: { workspaceId_userId_dedupeKey: { workspaceId, userId, dedupeKey: key } },
        create: {
            workspaceId,
            userId,
            dedupeKey: key,
            type: current.type as PrismaNotificationType,
            ...patch,
        },
        update: patch,
    });
    return true;
}

export async function markAllRead(workspaceId: string, userId: string): Promise<number> {
    const unread = (await computeNotifications(workspaceId, userId)).filter((n) => !n.isRead);
    if (unread.length === 0) return 0;
    const now = new Date();
    const keys = unread.map((n) => n.id);
    await prisma.$transaction([
        prisma.notification.updateMany({
            where: { workspaceId, userId, dedupeKey: { in: keys }, isRead: false },
            data: { isRead: true, readAt: now },
        }),
        prisma.notification.createMany({
            data: unread.map((n) => ({
                workspaceId,
                userId,
                dedupeKey: n.id,
                type: n.type as PrismaNotificationType,
                isRead: true,
                readAt: now,
            })),
            skipDuplicates: true,
        }),
    ]);
    return unread.length;
}