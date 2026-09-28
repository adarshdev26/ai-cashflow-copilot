import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getBalanceTrend } from '../api/get-balance-trend';
import { DaysRange } from '../types';

export function useBalanceTrend(days: DaysRange = 30) {
  return useQuery({
    queryKey: ['dashboard-metrics', 'balance-trend', days],
    queryFn: () => getBalanceTrend(days),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}