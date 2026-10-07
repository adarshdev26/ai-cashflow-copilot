import { prisma } from '@/lib/db/prisma';
import type { FinancialAccount as DbAccount } from '@/generated/prisma';
import type { AccountWithBalance } from '../types';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';

export type AccountTotals = Map<string, { credit: number; debit: number }>;

export function calcBalance(
    opening: number,
    credit: number,
    debit: number,
    transferOut = 0,
    transferIn = 0,
): number {
    return Math.round((opening + credit - debit - transferOut + transferIn) * 100) / 100;
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
        where: { workspaceId, accountId: { in: accountIds }, type: { in: FINANCIAL_TYPES } },
        _sum: { amount: true },
    });

    // Transfers: outgoing (this account is the source) and incoming (this account is the destination).
    const [outgoing, incoming] = await Promise.all([
        prisma.transaction.groupBy({
            by: ['accountId'],
            where: {
                workspaceId,
                accountId: { in: accountIds },
                type: 'TRANSFER',
            },
            _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
            by: ['toAccountId'],
            where: {
                workspaceId,
                toAccountId: { in: accountIds },
                type: 'TRANSFER',
            },
            _sum: { amount: true },
        }),
    ]);

    const out = new Map(outgoing.map((r) => [r.accountId, r._sum.amount ?? 0]));
    const inc = new Map(incoming.map((r) => [r.toAccountId, r._sum.amount ?? 0]));

    for (const row of rows) {
        if (!row.accountId) continue;
        const entry = totals.get(row.accountId) ?? { credit: 0, debit: 0 };
        if (row.type === 'CREDIT') entry.credit += row._sum.amount ?? 0;
        else entry.debit += row._sum.amount ?? 0;
        totals.set(row.accountId, entry);
    }

    // Fold transfer movements into the per-account totals so the final
    // balance formula stays `opening + credit - debit`.
    for (const [accountId, amount] of out) {
        if (!accountId) continue;
        const entry = totals.get(accountId) ?? { credit: 0, debit: 0 };
        entry.debit += amount;
        totals.set(accountId, entry);
    }
    for (const [accountId, amount] of inc) {
        if (!accountId) continue;
        const entry = totals.get(accountId) ?? { credit: 0, debit: 0 };
        entry.credit += amount;
        totals.set(accountId, entry);
    }

    return totals;
}

export function toAccountWithBalance(
    account: DbAccount & { _count: { transactions: number; incomingTransfers?: number } },
    totals: AccountTotals,
): AccountWithBalance {
    const t = totals.get(account.id) ?? { credit: 0, debit: 0 };
    const { _count, ...rest } = account;
    return {
        ...rest,
        createdAt: rest.createdAt.toISOString(),
        updatedAt: rest.updatedAt.toISOString(),
        balance: calcBalance(account.openingBalance, t.credit, t.debit),
        transactionCount: _count.transactions + (_count.incomingTransfers ?? 0),
    };
}
