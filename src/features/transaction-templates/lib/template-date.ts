import type { TransactionTemplateDTO } from '../types';

/** The user's local calendar date as YYYY-MM-DD (toISOString would shift the day in some timezones). */
export function localTodayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Date to put on a transaction created from this template:
 * - FIXED: the stored day (saved at 12:00 UTC, so the UTC date part is the calendar day)
 * - TODAY: the user's local today
 */
export function resolveTemplateDate(
  t: Pick<TransactionTemplateDTO, 'dateMode' | 'fixedDate'>,
): string {
  if (t.dateMode === 'FIXED' && t.fixedDate) return t.fixedDate.slice(0, 10);
  return localTodayISO();
}