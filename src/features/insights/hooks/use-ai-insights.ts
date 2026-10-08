import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAiInsights } from '../api/get-insights';
import type { InsightsRange, InsightsResponse } from '../types';

/** Month-to-date vs the same number of days last month. Stable for a whole day (no key churn). */
export function getInsightsRange(now = new Date()): InsightsRange {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const span = tomorrow.getTime() - monthStart.getTime();
    const prevEnd = new Date(Math.min(lastMonthStart.getTime() + span, monthStart.getTime()));
    return {
        gte: monthStart.toISOString(),
        lt: tomorrow.toISOString(),
        prevGte: lastMonthStart.toISOString(),
        prevLt: prevEnd.toISOString(),
    };
}

// Key deliberately does NOT start with 'transactions' or 'dashboard-metrics', so
// transaction mutations don't trigger a new Gemini call. Fresh data comes from
// staleTime expiry or the manual refresh button.
export function useAiInsights(workspaceId: string) {
    const range = getInsightsRange();
    return useQuery({
        queryKey: ['ai-insights', workspaceId, range.gte, range.lt],
        queryFn: () => getAiInsights(workspaceId, range),
        enabled: Boolean(workspaceId),
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        retry: false,
    });
}

export function useRefreshAiInsights(workspaceId: string) {
    const qc = useQueryClient();
    const range = getInsightsRange();
    return useMutation<InsightsResponse, Error, void>({
        mutationFn: () => getAiInsights(workspaceId, range, { force: true }),
        onSuccess: (data: InsightsResponse) => {
            qc.setQueryData(
                ['ai-insights', workspaceId, range.gte, range.lt],
                data,
            );
        },
    });
}