import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { InsightsResponse } from '../types';
import { ttlFor } from './cache-ttl';

export type CachedInsights = InsightsResponse & { cached: boolean };

export function rangeKey(gte: Date, lt: Date): string {
    return `${gte.toISOString()}|${lt.toISOString()}`;
}

/** Returns null on miss or expiry. Never throws — a cache read must not break the route. */
export async function readInsights(
    workspaceId: string,
    key: string,
): Promise<CachedInsights | null> {
    try {
        const row = await prisma.aiInsightsCache.findUnique({
            where: { workspaceId_rangeKey: { workspaceId, rangeKey: key } },
            select: { payload: true, generatedAt: true, expiresAt: true },
        });
        if (!row) return null;
        if (row.expiresAt.getTime() <= Date.now()) return null;

        const payload = row.payload as unknown as InsightsResponse;
        return { ...payload, cached: true };
    } catch (err) {
        console.warn('[insights] cache read failed', err);
        return null;
    }
}

/** Best-effort write. A cache write failure must not fail the request. */
export async function writeInsights(
    workspaceId: string,
    key: string,
    body: InsightsResponse,
    insightCount: number,
): Promise<void> {
    const ttl = ttlFor(insightCount);
    const expiresAt = new Date(Date.now() + ttl);
    try {
        await prisma.aiInsightsCache.upsert({
            where: { workspaceId_rangeKey: { workspaceId, rangeKey: key } },
            create: {
                workspaceId,
                rangeKey: key,
                payload: body as unknown as object,
                generatedAt: new Date(body.generatedAt),
                expiresAt,
            },
            update: {
                payload: body as unknown as object,
                generatedAt: new Date(body.generatedAt),
                expiresAt,
            },
        });
    } catch (err) {
        console.warn('[insights] cache write failed', err);
    }
}

/** Used by the refresh button. */
export async function invalidateInsights(
    workspaceId: string,
    key: string,
): Promise<void> {
    await prisma.aiInsightsCache
        .delete({ where: { workspaceId_rangeKey: { workspaceId, rangeKey: key } } })
        .catch(() => undefined);
}