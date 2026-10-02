import type { Granularity, ReportFilters, ReportType } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 1830; // ~60 months
const DAY_MS = 86_400_000;

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
export function resolvePreset(preset: Exclude<PresetId, 'custom'>, today = new Date()) {
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
    case 'this_year':
      return { from: toYmd(new Date(y, 0, 1)), to: toYmd(new Date(y, 11, 31)) };
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

export type ParsedParams =
  | { ok: true; filters: ReportFilters; range: DateRange; tz: number }
  | { ok: false; error: string };

export function parseReportParams(sp: URLSearchParams): ParsedParams {
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (!a || !b) return { ok: false, error: 'from and to must be valid dates (YYYY-MM-DD)' };

  const tz = Number(sp.get('tz') ?? '0');
  if (!Number.isInteger(tz) || tz < -840 || tz > 840) {
    return { ok: false, error: 'Invalid timezone offset' };
  }

  // local midnight expressed in UTC = UTC midnight + offset minutes
  const start = new Date(Date.UTC(a[0], a[1] - 1, a[2]) + tz * 60_000);
  const endExclusive = new Date(Date.UTC(b[0], b[1] - 1, b[2] + 1) + tz * 60_000);
  if (endExclusive <= start) return { ok: false, error: 'from must be on or before to' };
  if ((endExclusive.getTime() - start.getTime()) / DAY_MS > MAX_DAYS) {
    return { ok: false, error: 'Date range is too large (max 5 years)' };
  }

  const typeRaw = sp.get('type');
  let type: ReportType | undefined;
  if (typeRaw) {
    if (typeRaw !== 'CREDIT' && typeRaw !== 'DEBIT') {
      return { ok: false, error: 'type must be CREDIT or DEBIT' };
    }
    type = typeRaw;
  }

  const idOf = (key: string) => {
    const v = sp.get(key);
    return v && v.length <= 100 ? v : undefined;
  };

  return {
    ok: true,
    tz,
    range: { start, endExclusive },
    filters: { from, to, accountId: idOf('accountId'), categoryId: idOf('categoryId'), type },
  };
}

/** Query string for the client; the exact inverse of parseReportParams. */
export function toQueryString(f: ReportFilters, tz: number): string {
  const sp = new URLSearchParams({ from: f.from, to: f.to, tz: String(tz) });
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
    ...(f.type ? { type: f.type } : {}),
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

export function bucketKey(date: Date, tz: number, g: Granularity): string {
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