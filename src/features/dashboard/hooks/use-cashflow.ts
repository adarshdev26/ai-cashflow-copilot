import { useQuery } from '@tanstack/react-query';
import { getCashflow } from '../api/get-cashflow';

export function useCashflow() {
  return useQuery({
    queryKey: ['dashboard-metrics', 'cashflow'],
    queryFn: getCashflow,
    staleTime: 1000 * 60 * 5,
  });
}