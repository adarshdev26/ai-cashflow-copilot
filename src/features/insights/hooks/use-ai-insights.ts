import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAiInsights } from '../api/get-insights';
import { getInsightsRange } from '../lib/range';
import type { InsightsResponse } from '../types';

export { getInsightsRange };

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