import { BalanceTrendPoint, DaysRange } from '../types';

export async function getBalanceTrend(days: DaysRange): Promise<BalanceTrendPoint[]> {
  const res = await fetch(`/api/dashboard/balance-trend?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch balance trend');
  return res.json();
}