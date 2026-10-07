import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAiInsights, getDashboardInsightsPeriod } from '../api/get-ai-insights';

export function useAiInsights(workspaceId: string) {
    const period = useMemo(() => getDashboardInsightsPeriod(), []);

    return useQuery({
        queryKey: ['ai-insights', workspaceId, period.from, period.to],
        queryFn: () => getAiInsights(workspaceId, period),
        enabled: Boolean(workspaceId),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}
