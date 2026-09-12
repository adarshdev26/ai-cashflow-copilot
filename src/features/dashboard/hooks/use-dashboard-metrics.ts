import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '../api/get-dashboard-data';

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}