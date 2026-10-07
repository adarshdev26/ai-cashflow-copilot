'use client';

import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAccounts, useActiveAccountId } from '@/features/accounts';
import { useFinanceSummary } from '@/features/finance/hooks/use-finance-summary';

/**
 * Same account resolution as FinanceStats (null = all accounts; a stored account
 * that no longer exists falls back to all accounts). Shared by the dashboard
 * sections so they all use one query key and make one request.
 */
export function useDashboardSummary() {
    const workspaceId = useActiveWorkspaceId();
    const [activeAccountId] = useActiveAccountId();
    const { data: accounts } = useAccounts(workspaceId, { activeOnly: true });

    const accountId =
        activeAccountId && (!accounts || accounts.some((a) => a.id === activeAccountId))
            ? activeAccountId
            : null;

    const summary = useFinanceSummary(workspaceId, accountId);

    return { workspaceId, accountId, accounts, ...summary };
}