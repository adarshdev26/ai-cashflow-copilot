import { prisma } from '@/lib/db/prisma';
import type { FinancialAccount as DbAccount } from '@/generated/prisma';
import type { AccountWithBalance } from '../types';

export type AccountTotals = Map<string, { credit: number; debit: number }>;

export function calcBalance(opening: number, credit: number, debit: number): number {
    return Math.round((opening + credit - debit) * 100) / 100;
}

/** One grouped DB query for all accounts. No JS loop over transaction rows. */
export async function getAccountTotals(
    workspaceId: string,
    accountIds: string[],
): Promise<AccountTotals> {
    const totals: AccountTotals = new Map();
    if (accountIds.length === 0) return totals;

    const rows = await prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where: { workspaceId, accountId: { in: accountIds } },
        _sum: { amount: true },
    });

    for (const row of rows) {
        if (!row.accountId) continue;
        const entry = totals.get(row.accountId) ?? { credit: 0, debit: 0 };
        if (row.type === 'CREDIT') entry.credit += row._sum.amount ?? 0;
        else entry.debit += row._sum.amount ?? 0;
        totals.set(row.accountId, entry);
    }
    return totals;
}

export function toAccountWithBalance(
    account: DbAccount & { _count: { transactions: number } },
    totals: AccountTotals,
): AccountWithBalance {
    const t = totals.get(account.id) ?? { credit: 0, debit: 0 };
    const { _count, ...rest } = account;
    return {
        ...rest,
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        balance: calcBalance(account.openingBalance, t.credit, t.debit),
        transactionCount: _count.transactions,
    };
}
