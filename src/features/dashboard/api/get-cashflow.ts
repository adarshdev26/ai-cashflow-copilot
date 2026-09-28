import { CashflowPoint, MonthsRange } from '../types';
import { apiFetch, withWorkspace } from '@/lib/api-client';

export async function getCashflow(workspaceId: string, months: MonthsRange): Promise<CashflowPoint[]> {
  return apiFetch<CashflowPoint[]>(
    `/api/dashboard/cashflow?months=${months}`,
    withWorkspace(workspaceId)
  );
}