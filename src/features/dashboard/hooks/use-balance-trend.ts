import { useQuery } from '@tanstack/react-query';
import { getBalanceTrend } from '../api/get-balance-trend';

export function useBalanceTrend() {
  return useQuery({
    queryKey: ['dashboard-metrics', 'balance-trend'],
    queryFn: getBalanceTrend,
    staleTime: 1000 * 60 * 5,
  });
}