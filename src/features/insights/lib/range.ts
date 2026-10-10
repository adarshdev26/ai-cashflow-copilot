import type { InsightsRange } from '../types';

/**
 * Month-to-date vs the same number of days last month, in UTC.
 * UTC keeps the dashboard request and the 06:00 cron on the same cache key.
 */
export function getInsightsRange(now = new Date()): InsightsRange {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const span = tomorrow.getTime() - monthStart.getTime();
    const prevEnd = new Date(Math.min(lastMonthStart.getTime() + span, monthStart.getTime()));
    return {
        gte: monthStart.toISOString(),
        lt: tomorrow.toISOString(),
        prevGte: lastMonthStart.toISOString(),
        prevLt: prevEnd.toISOString(),
    };
}
