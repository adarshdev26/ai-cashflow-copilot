import 'server-only';
import { getRedis } from '@/lib/redis';
import type { InsightsResponse } from '../types';

export const INSIGHTS_REDIS_TTL_SECONDS = 86_400;

export function insightsRedisKey(workspaceId: string, key: string): string {
    return `insights:${workspaceId}:${key}`;
}

function isInsightsPayload(value: unknown): value is InsightsResponse {
    if (typeof value !== 'object' || value === null) return false;
    const payload = value as Partial<InsightsResponse>;
    return (
        Array.isArray(payload.insights) &&
        typeof payload.generatedAt === 'string' &&
        typeof payload.period?.from === 'string' &&
        typeof payload.period?.to === 'string'
    );
}

/** Returns null on miss or a bad payload. Never throws — a cache read must not break the route. */
export async function readRedisInsights(
    workspaceId: string,
    key: string,
): Promise<(InsightsResponse & { cached: true }) | null> {
    try {
        const raw = await getRedis().get<unknown>(insightsRedisKey(workspaceId, key));
        if (!isInsightsPayload(raw)) return null;
        return { ...raw, cached: true };
    } catch (err) {
        console.warn('[insights] redis read failed', err instanceof Error ? err.message : err);
        return null;
    }
}

/** Best-effort write. A cache write failure must not fail the request. */
export async function writeRedisInsights(
    workspaceId: string,
    key: string,
    body: InsightsResponse,
): Promise<boolean> {
    try {
        await getRedis().set(insightsRedisKey(workspaceId, key), body, {
            ex: INSIGHTS_REDIS_TTL_SECONDS,
        });
        return true;
    } catch (err) {
        console.warn('[insights] redis write failed', err instanceof Error ? err.message : err);
        return false;
    }
}
