import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getCashflow } from '../api/get-cashflow';
import { MonthsRange } from '../types';

export function useCashflow(months: MonthsRange = 6) {
  return useQuery({
    queryKey: ['dashboard-metrics', 'cashflow', months],
    queryFn: () => getCashflow(months),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}