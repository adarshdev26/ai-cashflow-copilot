import { CashflowPoint, MonthsRange } from '../types';

export async function getCashflow(months: MonthsRange): Promise<CashflowPoint[]> {
  const res = await fetch(`/api/dashboard/cashflow?months=${months}`);
  if (!res.ok) throw new Error('Failed to fetch cashflow');
  return res.json();
}