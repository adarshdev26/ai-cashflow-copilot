const HALF_DAY_MS = 12 * 60 * 60 * 1000;

export function parseMonthKey(value: string): { year: number; month0: number } | null {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return { year, month0: month - 1 };
}

export function monthKeyOf(year: number, month0: number): string {
    return `${year}-${String(month0 + 1).padStart(2, '0')}`;
}

export function utcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function addDaysKey(key: string, days: number): string {
    const [y, m, d] = key.split('-').map(Number);
    return utcDateKey(new Date(Date.UTC(y, m - 1, d + days)));
}

/** The visible grid: whole weeks covering the month, e.g. Mon 28 Sep to Sun 1 Nov for Oct 2026. */
export function gridRange(year: number, month0: number, weekStartsOn = 1) {
    const first = new Date(Date.UTC(year, month0, 1));
    const last = new Date(Date.UTC(year, month0 + 1, 0));
    const lead = (first.getUTCDay() - weekStartsOn + 7) % 7;
    const trail = (weekStartsOn + 6 - last.getUTCDay() + 7) % 7;

    const startKey = addDaysKey(`${monthKeyOf(year, month0)}-01`, -lead);
    const endKey = addDaysKey(utcDateKey(last), trail);

    const keys: string[] = [];
    for (let key = startKey; key <= endKey; key = addDaysKey(key, 1)) keys.push(key);
    return { startKey, endKey, keys };
}

function monthIndexOf(date: Date): number {
    // Budget start dates may be a browser-local month start sent as a UTC instant
    // (IST "Oct 1" is Sep 30 18:30Z). +12h puts every timezone on the right month.
    const shifted = new Date(date.getTime() + HALF_DAY_MS);
    return shifted.getUTCFullYear() * 12 + shifted.getUTCMonth();
}

export function budgetAppliesToMonth(
    startDate: Date,
    endDate: Date | null,
    year: number,
    month0: number,
): boolean {
    const index = year * 12 + month0;
    if (monthIndexOf(startDate) > index) return false;
    return endDate === null || index <= monthIndexOf(endDate);
}
