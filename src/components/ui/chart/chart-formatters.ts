import { formatINR } from '@/features/budgets/utils';
import type { Granularity } from '@/features/reports/types';

const compact = (locale = 'en-IN') => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = (locale = 'en-IN') => new Intl.NumberFormat(locale, {
  style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1,
});
const full = (locale = 'en-IN') => new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCompact = (value: number, locale = 'en-IN') => compactCurrency(locale).format(value);
export const formatCompactNumber = (value: number, locale = 'en-IN') => compact(locale).format(value);
export const formatCurrency = (value: number, locale = 'en-IN') => full(locale).format(value);
export { formatINR };

export function formatCurrencyAmount(value: number, currency: string | null, locale = 'en-IN') {
  if (!currency) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return formatINR(value, locale);
  }
}

export const formatDay = (date: string, withYear = false, locale = 'en-IN') =>
  new Date(`${date}T00:00:00`).toLocaleDateString(
    locale,
    withYear ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' }
  );

export function formatReportBucket(key: string, granularity: Granularity, locale = 'en-IN') {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day ?? 1));
  return granularity === 'month'
    ? date.toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' })
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
