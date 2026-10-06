import { useQuery } from '@tanstack/react-query';
import { apiFetch, withWorkspace } from '@/lib/api-client';

export type PeriodTotals = { income: number; expense: number; net: number; count: number };
export type TransactionSummary = {
    allTime: PeriodTotals;
    thisMonth: PeriodTotals;
    lastMonth: PeriodTotals;
};

/** Month boundaries in the user's local timezone (ISO strings, stable for the whole month). */
function getMonthRange() {
    const now = new Date();
    return {
        lastMonthStart: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        thisMonthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        nextMonthStart: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    };
}

/**
 * Totals for the finance stat cards (GET /api/finance/summary).
 * The key starts with 'transactions' and includes workspaceId, so the existing
 * invalidateQueries({ queryKey: ['transactions', workspaceId] }) in the create / update /
 * delete mutations refreshes the cards automatically.
 */
export function useFinanceSummary(workspaceId: string) {
    const range = getMonthRange();
    return useQuery({
        queryKey: ['transactions', workspaceId, 'summary', range],
        queryFn: () =>
            apiFetch<TransactionSummary>(
                `/api/finance/summary?${new URLSearchParams(range).toString()}`,
                withWorkspace(workspaceId),
            ),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
