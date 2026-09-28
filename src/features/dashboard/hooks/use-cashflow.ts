import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getCashflow } from '../api/get-cashflow';
import { MonthsRange } from '../types';

export function useCashflow(workspaceId: string, months: MonthsRange = 6) {
  return useQuery({
    queryKey: ['dashboard-metrics', workspaceId, 'cashflow', months],
    queryFn: () => getCashflow(workspaceId, months),
    staleTime: 1000 * 60 * 5,
    // keepPreviousData is safe here: the workspaceId is in the key, so React Query
    // treats a different workspace as a different cache entry and will not recycle
    // stale data from another workspace.
    placeholderData: keepPreviousData,
  });
}