import { formatINR } from '@/features/budgets/utils';
import type { Granularity } from '@/features/reports/types';

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCompact = (value: number) => `₹${compact.format(value)}`;
export const formatCompactNumber = (value: number) => compact.format(value);
export const formatCurrency = (value: number) => full.format(value);
export { formatINR };

export function formatCurrencyAmount(value: number, currency: string | null) {
  if (!currency) return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return formatINR(value);
  }
}

export const formatDay = (date: string, withYear = false) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-IN',
    withYear ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }
  );

export function formatReportBucket(key: string, granularity: Granularity) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day ?? 1));
  return granularity === 'month'
    ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
