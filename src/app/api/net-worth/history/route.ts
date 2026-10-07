import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';
import { buildHistoryFromValues, buildMonthEnds, round2 } from '@/features/net-worth/lib/net-worth';

function monthEnd(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAction(req, 'workspace.read');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const range = new URL(req.url).searchParams.get('range') ?? '6m';
        const months = buildMonthEnds(range, new Date());
        if (months.length === 0) {
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        const accounts = await prisma.financialAccount.findMany({
            where: { workspaceId, isActive: true },
            select: {
                id: true,
                openingBalance: true,
                classification: true,
            },
        });

        if (accounts.length === 0) {
            const empty = months.map((point) => ({
                label: point.label,
                month: point.label,
                netWorth: 0,
                change: 0,
                changePercent: null,
            }));
            return NextResponse.json({ data: empty }, { status: 200 });
        }

        const accountIds = accounts.map((account) => account.id);
        const firstMonth = months[0].month;
        const monthStart = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth(), 1));
        const transactions = await prisma.transaction.findMany({
            where: {
                workspaceId,
                OR: [
                    { accountId: { in: accountIds } },
                    { toAccountId: { in: accountIds } },
                ],
                type: { in: FINANCIAL_TYPES },
                createdAt: { gte: monthStart },
            },
            select: {
                accountId: true,
                toAccountId: true,
                amount: true,
                type: true,
                createdAt: true,
            },
        });

        const values = months.map((point) => {
            const endOfMonth = monthEnd(point.month);
            let assets = 0;
            let liabilities = 0;

            for (const account of accounts) {
                let running = account.openingBalance;

                for (const transaction of transactions) {
                    if (transaction.createdAt > endOfMonth) continue;
                    const isSource = transaction.accountId === account.id;
                    const isTarget = transaction.toAccountId === account.id;
                    if (!isSource && !isTarget) continue;

                    const amount = Number(transaction.amount ?? 0);
                    if (transaction.type === 'CREDIT' && isSource) running += amount;
                    if (transaction.type === 'DEBIT' && isSource) running -= amount;
                    if (transaction.type === 'TRANSFER' && isSource) running -= amount;
                    if (transaction.type === 'TRANSFER' && isTarget) running += amount;
                }

                if (account.classification === 'ASSET') {
                    assets += running;
                } else {
                    liabilities += Math.abs(running);
                }
            }

            return {
                month: point.label,
                netWorth: round2(assets - liabilities),
            };
        });

        const history = buildHistoryFromValues(range, values, new Date());
        return NextResponse.json({ data: history }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch net worth history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
