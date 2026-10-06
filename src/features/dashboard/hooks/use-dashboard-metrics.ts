import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/get-dashboard-data';

export function useDashboardMetrics(workspaceId: string) {
    return useQuery({
        queryKey: ['dashboard-metrics', workspaceId],
        queryFn: () => getDashboardMetrics(workspaceId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
