import type { Granularity, ReportFilters, ReportTimezoneParams, ReportType } from '../types';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

export type DateRange = { start: Date; endExclusive: Date };

// ---------- presets (client side, use the browser's local date) ----------

export const PRESETS = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'this_year', label: 'This Year' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'last_12_months', label: 'Last 12 Months' },
    { id: 'custom', label: 'Custom Range' },
] as const;
export type PresetId = (typeof PRESETS)[number]['id'];

export function toYmd(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

/** Returns local from/to dates for a preset. `to` is inclusive. */
export function resolvePreset(
    preset: Exclude<PresetId, 'custom'>,
    today = new Date(),
    fiscalYearStartMonth = 1,
) {
    const y = today.getFullYear();
    const m = today.getMonth();
    switch (preset) {
        case 'this_month':
            return { from: toYmd(new Date(y, m, 1)), to: toYmd(new Date(y, m + 1, 0)) };
        case 'last_month':
            return { from: toYmd(new Date(y, m - 1, 1)), to: toYmd(new Date(y, m, 0)) };
        case 'this_quarter': {
            const qStart = Math.floor(m / 3) * 3;
            return { from: toYmd(new Date(y, qStart, 1)), to: toYmd(new Date(y, qStart + 3, 0)) };
        }
        case 'this_year': {
            const startMonth = Math.min(12, Math.max(1, fiscalYearStartMonth)) - 1;
            const startYear = m >= startMonth ? y : y - 1;
            return {
                from: toYmd(new Date(startYear, startMonth, 1)),
                to: toYmd(new Date(startYear + 1, startMonth, 0)),
            };
        }
        case 'last_6_months':
            return { from: toYmd(new Date(y, m - 5, 1)), to: toYmd(new Date(y, m + 1, 0)) };
        case 'last_12_months':
            return { from: toYmd(new Date(y, m - 11, 1)), to: toYmd(new Date(y, m + 1, 0)) };
    }
}

// ---------- parsing / validation (server side) ----------

function parseYmd(s: string): [number, number, number] | null {
    if (!DATE_RE.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
        return null;
    }
    return [y, m, d];
}

function formatterFor(timeZone: string) {
    let formatter = zonedFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        });
        zonedFormatters.set(timeZone, formatter);
    }
    return formatter;
}

function zonedParts(date: Date, timeZone: string) {
    const values = Object.fromEntries(
        formatterFor(timeZone)
            .formatToParts(date)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, Number(part.value)]),
    );
    return {
        year: values.year,
        month: values.month,
        day: values.day,
        hour: values.hour,
        minute: values.minute,
        second: values.second,
    };
}

export function isValidTimeZone(value: string) {
    try {
        formatterFor(value);
        return true;
    } catch {
        return false;
    }
}

/** Converts the start of a viewer-local calendar date to its UTC instant, including DST. */
export function localDayStart(value: string, timeZone: string) {
    const parts = parseYmd(value);
    if (!parts) throw new Error('Invalid local date');
    const [year, month, day] = parts;
    const target = Date.UTC(year, month - 1, day);
    let instant = target;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const local = zonedParts(new Date(instant), timeZone);
        const represented = Date.UTC(
            local.year,
            local.month - 1,
            local.day,
            local.hour,
            local.minute,
            local.second,
        );
        const difference = target - represented;
        instant += difference;
        if (difference === 0) break;
    }
    return new Date(instant);
}

export function localDateKey(date: Date, timeZone: string) {
    const parts = zonedParts(date, timeZone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export type ParsedParams =
    | {
          ok: true;
          filters: ReportFilters;
          range: DateRange;
          tz: number;
          timeZone?: ReportTimezoneParams['tz'];
      }
    | { ok: false; error: string };

export function parseReportParams(sp: URLSearchParams, maxDays: number): ParsedParams {
    const from = sp.get('from') ?? '';
    const to = sp.get('to') ?? '';
    const a = parseYmd(from);
    const b = parseYmd(to);
    if (!a || !b) return { ok: false, error: 'from and to must be valid dates (YYYY-MM-DD)' };

    const rawTz = sp.get('tz');
    const parsedLegacyTz = rawTz === null ? Number.NaN : Number(rawTz);
    const timeZone =
        rawTz && !Number.isFinite(parsedLegacyTz) && isValidTimeZone(rawTz) ? rawTz : undefined;
    const fallbackTz = sp.get('tzOffset') ?? rawTz ?? '0';
    const parsedOffset = Number(fallbackTz);
    if (
        !timeZone &&
        (!Number.isInteger(parsedOffset) || parsedOffset < -840 || parsedOffset > 840)
    ) {
        return { ok: false, error: 'Invalid timezone offset' };
    }
    const tz =
        Number.isInteger(parsedOffset) && parsedOffset >= -840 && parsedOffset <= 840
            ? parsedOffset
            : 0;

    const nextDate = new Date(Date.UTC(b[0], b[1] - 1, b[2] + 1)).toISOString().slice(0, 10);
    const start = timeZone
        ? localDayStart(from, timeZone)
        : new Date(Date.UTC(a[0], a[1] - 1, a[2]) + tz * 60_000);
    const endExclusive = timeZone
        ? localDayStart(nextDate, timeZone)
        : new Date(Date.UTC(b[0], b[1] - 1, b[2] + 1) + tz * 60_000);
    if (endExclusive <= start) return { ok: false, error: 'from must be on or before to' };
    if ((endExclusive.getTime() - start.getTime()) / DAY_MS > maxDays) {
        return {
            ok: false,
            error: `Date range is too large (max ${Math.ceil(maxDays / 365)} years)`,
        };
    }

    const typeRaw = sp.get('type');
    let type: ReportType | undefined;
    if (typeRaw) {
        if (typeRaw !== 'CREDIT' && typeRaw !== 'DEBIT') {
            return { ok: false, error: 'type must be CREDIT or DEBIT' };
        }
        type = typeRaw;
    }

    const accountId = sp.get('accountId');
    const categoryId = sp.get('categoryId');
    if (accountId && accountId.length > 100) {
        return { ok: false, error: 'accountId is too long' };
    }
    if (categoryId && categoryId.length > 100) {
        return { ok: false, error: 'categoryId is too long' };
    }

    return {
        ok: true,
        tz,
        ...(timeZone ? { timeZone } : {}),
        range: { start, endExclusive },
        filters: {
            from,
            to,
            accountId: accountId || undefined,
            categoryId: categoryId || undefined,
            type,
        },
    };
}

/** Query string for the client; the exact inverse of parseReportParams. */
export function toQueryString(f: ReportFilters, tz: string | number, tzOffset?: number): string {
    const sp = new URLSearchParams({ from: f.from, to: f.to });
    if (typeof tz === 'number') {
        sp.set('tz', String(tz));
    } else {
        sp.set('tz', tz);
        if (tzOffset !== undefined) sp.set('tzOffset', String(tzOffset));
    }
    if (f.accountId) sp.set('accountId', f.accountId);
    if (f.categoryId) sp.set('categoryId', f.categoryId);
    if (f.type) sp.set('type', f.type);
    return sp.toString();
}

/** THE shared where-clause. Report and CSV export both use it. Always workspace-scoped. */
export function buildReportWhere(workspaceId: string, f: ReportFilters, range: DateRange) {
    return {
        workspaceId,
        createdAt: { gte: range.start, lt: range.endExclusive },
        ...(f.accountId ? { accountId: f.accountId } : {}),
        ...(f.categoryId ? { categoryId: f.categoryId } : {}),
        type: f.type === 'CREDIT' || f.type === 'DEBIT' ? f.type : { in: FINANCIAL_TYPES },
    };
}

// ---------- calculations ----------

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function savingsRate(income: number, expenses: number): number {
    if (!income || income <= 0) return 0;
    const rate = ((income - expenses) / income) * 100;
    return Number.isFinite(rate) ? Math.round(rate * 10) / 10 : 0;
}

export function pickGranularity(range: DateRange): Granularity {
    const days = (range.endExclusive.getTime() - range.start.getTime()) / DAY_MS;
    return days <= 62 ? 'day' : 'month';
}

/** Shift an instant into the user's local time, then read it with UTC getters. */
function local(date: Date, tz: number) {
    return new Date(date.getTime() - tz * 60_000);
}

export function bucketKey(date: Date, tz: number, g: Granularity, timeZone?: string): string {
    if (timeZone) {
        const key = localDateKey(date, timeZone);
        return g === 'month' ? key.slice(0, 7) : key;
    }
    const d = local(date, tz);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return g === 'month' ? ym : `${ym}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Every bucket key in the range, so empty periods show as zero. */
export function bucketKeys(f: ReportFilters, g: Granularity): string[] {
    const [y1, m1, d1] = f.from.split('-').map(Number);
    const [y2, m2, d2] = f.to.split('-').map(Number);
    const keys: string[] = [];
    if (g === 'month') {
        let y = y1;
        let m = m1;
        while (y < y2 || (y === y2 && m <= m2)) {
            keys.push(`${y}-${String(m).padStart(2, '0')}`);
            m += 1;
            if (m > 12) {
                m = 1;
                y += 1;
            }
        }
        return keys;
    }
    const end = Date.UTC(y2, m2 - 1, d2);
    for (let t = Date.UTC(y1, m1 - 1, d1); t <= end; t += DAY_MS) {
        keys.push(new Date(t).toISOString().slice(0, 10));
    }
    return keys;
}

/** The "YYYY-MM" if the range is exactly one full calendar month, else null. */
export function singleFullMonth(f: ReportFilters): string | null {
    if (f.from.slice(0, 7) !== f.to.slice(0, 7) || f.from.slice(8) !== '01') return null;
    const [y, m] = f.from.split('-').map(Number);
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Number(f.to.slice(8)) === lastDay ? f.from.slice(0, 7) : null;
}

export function budgetStatus(spent: number, budget: number) {
    if (spent > budget) return 'over' as const;
    if (budget > 0 && spent / budget >= 0.8) return 'warning' as const;
    return 'on_track' as const;
}
