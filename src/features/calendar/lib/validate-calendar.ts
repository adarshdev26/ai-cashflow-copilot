import { isValidTimeZone } from '@/features/reports/lib/report-filters';
import { parseMonthKey } from './calendar-dates';

export type CalendarParams = {
    year: number;
    month0: number;
    monthKey: string;
    tz: string;
    accountId?: string;
};

export type CalendarParamsResult =
    { ok: true; params: CalendarParams } | { ok: false; error: string };

const MAX_MONTHS_AWAY = 24;

export function parseCalendarParams(sp: URLSearchParams, now = new Date()): CalendarParamsResult {
    const fallback = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthKey = sp.get('month') ?? fallback;
    const parsed = parseMonthKey(monthKey);
    if (!parsed) return { ok: false, error: 'month must be YYYY-MM' };

    const away = Math.abs(
        parsed.year * 12 + parsed.month0 - (now.getUTCFullYear() * 12 + now.getUTCMonth()),
    );
    if (away > MAX_MONTHS_AWAY) return { ok: false, error: 'month is out of range' };

    const tz = sp.get('tz') || 'UTC';
    if (!isValidTimeZone(tz)) return { ok: false, error: 'Invalid time zone' };

    const accountId = sp.get('accountId') || undefined;
    if (accountId && accountId.length > 100) {
        return { ok: false, error: 'accountId is too long' };
    }

    return {
        ok: true,
        params: { year: parsed.year, month0: parsed.month0, monthKey, tz, accountId },
    };
}
