import { CashflowPoint } from '../types';

export async function getCashflow(): Promise<CashflowPoint[]> {
  const res = await fetch('/api/dashboard/cashflow');
  if (!res.ok) throw new Error('Failed to fetch cashflow');
  return res.json();
}