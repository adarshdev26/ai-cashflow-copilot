export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * TEST SWITCH
 * true  = WEEKLY runs every 5 seconds (no catch-up), for local testing
 * false = WEEKLY runs every 7 days (normal behaviour)
 */
const TEST_FAST_WEEKLY = false;
const TEST_STEP_MS = 5_000;

/** Schedule dates are calendar dates stored at 12:00 UTC. */
export const SCHEDULE_HOUR_UTC = 12;
/** Max occurrences generated per schedule per job run (catch-up cap). */
export const MAX_OCCURRENCES_PER_RUN = 24;

const DAY_MS = 86_400_000;
const WEEKLY_STEP_MS = TEST_FAST_WEEKLY ? TEST_STEP_MS : 7 * DAY_MS;

/**
 * Normalise to a schedule date (12:00 UTC of a calendar day).
 * - string: the YYYY-MM-DD part AS WRITTEN is the calendar day (no timezone shift).
 * - Date: its UTC calendar day is used.
 */
export function toScheduleDate(input: string | Date): Date {
    if (typeof input === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
        if (!m) throw new Error('Invalid date');
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        const date = new Date(Date.UTC(y, mo - 1, d, SCHEDULE_HOUR_UTC));
        if (
            date.getUTCFullYear() !== y ||
            date.getUTCMonth() !== mo - 1 ||
            date.getUTCDate() !== d
        ) {
            throw new Error('Invalid date');
        }
        return date;
    }
    if (Number.isNaN(input.getTime())) throw new Error('Invalid date');
    return new Date(
        Date.UTC(
            input.getUTCFullYear(),
            input.getUTCMonth(),
            input.getUTCDate(),
            SCHEDULE_HOUR_UTC,
        ),
    );
}

function daysInMonth(year: number, month0: number): number {
    return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/**
 * The n-th occurrence (n = 0 is startDate), always derived from the start
 * anchor so month-end clamping never drifts (Jan 31 -> Feb 28 -> Mar 31).
 */
export function occurrenceAt(
    startDate: string | Date,
    frequency: RecurringFrequency,
    index: number,
): Date {
    if (!Number.isInteger(index) || index < 0) throw new Error('Invalid index');
    const s = toScheduleDate(startDate);
    const sy = s.getUTCFullYear();
    const sm = s.getUTCMonth();
    const sd = s.getUTCDate();

    switch (frequency) {
        case 'WEEKLY':
            return new Date(s.getTime() + index * WEEKLY_STEP_MS);
        case 'MONTHLY': {
            const total = sy * 12 + sm + index;
            const y = Math.floor(total / 12);
            const m = total % 12;
            return new Date(Date.UTC(y, m, Math.min(sd, daysInMonth(y, m)), SCHEDULE_HOUR_UTC));
        }
        case 'YEARLY': {
            const y = sy + index;
            return new Date(Date.UTC(y, sm, Math.min(sd, daysInMonth(y, sm)), SCHEDULE_HOUR_UTC));
        }
        default:
            throw new Error('Invalid frequency');
    }
}

/** Lower-bound index estimate near `target`; callers step forward from it. */
function estimateIndex(start: Date, frequency: RecurringFrequency, target: Date): number {
    let est: number;
    if (frequency === 'WEEKLY') {
        est = Math.floor((target.getTime() - start.getTime()) / WEEKLY_STEP_MS);
    } else if (frequency === 'MONTHLY') {
        est =
            (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
            (target.getUTCMonth() - start.getUTCMonth());
    } else {
        est = target.getUTCFullYear() - start.getUTCFullYear();
    }
    return Math.max(0, est - 1);
}

/** First occurrence at or after `from`. */
export function firstOccurrenceOnOrAfter(
    startDate: string | Date,
    frequency: RecurringFrequency,
    from: Date,
): Date {
    const s = toScheduleDate(startDate);
    if (TEST_FAST_WEEKLY && frequency === 'WEEKLY') return s; // due immediately
    if (from.getTime() <= s.getTime()) return s;
    let i = estimateIndex(s, frequency, from);
    let occ = occurrenceAt(s, frequency, i);
    while (occ.getTime() < from.getTime()) {
        i += 1;
        occ = occurrenceAt(s, frequency, i);
    }
    return occ;
}

/** First occurrence strictly after `after`. */
export function nextOccurrenceAfter(
    startDate: string | Date,
    frequency: RecurringFrequency,
    after: Date,
): Date {
    const s = toScheduleDate(startDate);
    if (after.getTime() < s.getTime()) return s;
    let i = estimateIndex(s, frequency, after);
    let occ = occurrenceAt(s, frequency, i);
    while (occ.getTime() <= after.getTime()) {
        i += 1;
        occ = occurrenceAt(s, frequency, i);
    }
    return occ;
}

export interface DueOccurrencesInput {
    startDate: string | Date;
    frequency: RecurringFrequency;
    /** The next occurrence not yet generated (persisted nextRunAt). */
    nextRunAt: Date;
    endDate?: string | Date | null;
    now: Date;
    limit?: number;
}

export interface DueOccurrencesResult {
    /** Occurrences to generate now, oldest first. */
    occurrences: Date[];
    /** New value for nextRunAt after generating `occurrences`. */
    nextRunAt: Date;
    /** True when the per-run cap was hit and more are still due. */
    hasMore: boolean;
    /** True when nextRunAt is past endDate (schedule has ended). */
    finished: boolean;
}

/** Which occurrences are due at `now`, honouring endDate and a catch-up cap. */
export function collectDueOccurrences(input: DueOccurrencesInput): DueOccurrencesResult {
    const limit = input.limit ?? MAX_OCCURRENCES_PER_RUN;
    const end = input.endDate ? toScheduleDate(input.endDate) : null;
    const isLive = (d: Date) =>
        d.getTime() <= input.now.getTime() && (end === null || d.getTime() <= end.getTime());

    // TEST MODE: no catch-up, emit only the latest due 5-second slot
    if (TEST_FAST_WEEKLY && input.frequency === 'WEEKLY' && isLive(input.nextRunAt)) {
        const s = toScheduleDate(input.startDate);
        const upTo = end && end.getTime() < input.now.getTime() ? end : input.now;
        const idx = Math.floor((upTo.getTime() - s.getTime()) / WEEKLY_STEP_MS);
        const latest = occurrenceAt(s, 'WEEKLY', idx);
        const next = new Date(latest.getTime() + WEEKLY_STEP_MS);
        return {
            occurrences: [latest],
            nextRunAt: next,
            hasMore: false,
            finished: end !== null && next.getTime() > end.getTime(),
        };
    }

    const occurrences: Date[] = [];
    let cursor = input.nextRunAt;

    while (occurrences.length < limit && isLive(cursor)) {
        occurrences.push(cursor);
        cursor = nextOccurrenceAfter(input.startDate, input.frequency, cursor);
    }

    const finished = end !== null && cursor.getTime() > end.getTime();
    return { occurrences, nextRunAt: cursor, hasMore: isLive(cursor), finished };
}

export interface WindowOccurrencesInput {
    startDate: string | Date;
    frequency: RecurringFrequency;
    /** Persisted nextRunAt: the first occurrence NOT yet generated. */
    nextRunAt: Date;
    endDate?: string | Date | null;
    windowStart: Date;
    /** Inclusive. */
    windowEnd: Date;
    limit?: number;
}

/**
 * Read-only preview of the not-yet-generated occurrences inside
 * [windowStart, windowEnd]. Uses the same date math as the cron and never writes.
 */
export function listOccurrencesInWindow(input: WindowOccurrencesInput): Date[] {
    const limit = input.limit ?? MAX_OCCURRENCES_PER_RUN;
    const end = input.endDate ? toScheduleDate(input.endDate) : null;

    let cursor = input.nextRunAt;
    if (cursor.getTime() < input.windowStart.getTime()) {
        cursor = firstOccurrenceOnOrAfter(input.startDate, input.frequency, input.windowStart);
    }

    const out: Date[] = [];
    while (
        out.length < limit &&
        cursor.getTime() <= input.windowEnd.getTime() &&
        (end === null || cursor.getTime() <= end.getTime())
    ) {
        out.push(cursor);
        cursor = nextOccurrenceAfter(input.startDate, input.frequency, cursor);
    }
    return out;
}
