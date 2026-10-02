import type { QueryClient } from '@tanstack/react-query';
import { reportKeys } from './use-reports';

export function invalidateReports(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: reportKeys.all });
}
