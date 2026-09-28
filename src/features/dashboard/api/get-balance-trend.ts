import { BalanceTrendPoint } from '../types';

export async function getBalanceTrend(): Promise<BalanceTrendPoint[]> {
  const res = await fetch('/api/dashboard/balance-trend');
  if (!res.ok) throw new Error('Failed to fetch balance trend');
  return res.json();
}