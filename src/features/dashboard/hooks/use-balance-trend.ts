import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getBalanceTrend } from '../api/get-balance-trend';
import { DaysRange } from '../types';

export function useBalanceTrend(workspaceId: string, days: DaysRange = 30) {
  return useQuery({
    queryKey: ['dashboard-metrics', workspaceId, 'balance-trend', days],
    queryFn: () => getBalanceTrend(workspaceId, days),
    staleTime: 1000 * 60 * 5,
    // Same as cashflow: workspaceId in key prevents cross-workspace recycling.
    placeholderData: keepPreviousData,
  });
}