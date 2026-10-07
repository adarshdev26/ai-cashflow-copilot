import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { calcBalance, getAccountTotals } from '@/features/accounts/lib/balance';
import { splitAccounts } from '@/features/net-worth/lib/net-worth';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAction(req, 'workspace.read');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const accounts = await prisma.financialAccount.findMany({
            where: { workspaceId, isActive: true },
            orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        });

        const totals = await getAccountTotals(
            workspaceId,
            accounts.map((account) => account.id),
        );

        const rows = accounts.map((account) => {
            const balance = calcBalance(
                account.openingBalance,
                totals.get(account.id)?.credit ?? 0,
                totals.get(account.id)?.debit ?? 0,
            );

            return {
                id: account.id,
                name: account.name,
                type: account.type,
                classification: account.classification,
                balance,
                amountOwed: account.classification === 'LIABILITY' ? Math.abs(balance) : 0,
                currency: account.currency,
                sharePercent: null,
            };
        });

        const summary = splitAccounts(rows);

        return NextResponse.json(
            {
                data: {
                    ...summary,
                    netWorth: summary.netWorth,
                    totalAssets: summary.totalAssets,
                    totalLiabilities: summary.totalLiabilities,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Failed to fetch net worth:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
