import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { captureRouteError } from '@/lib/admin/errors';
import { GeminiConfigError } from '@/lib/gemini';
import { aiAssistantDisabledResponse } from '@/lib/settings/ai-assistant';
import { readInsights, writeInsights, rangeKey } from '@/features/insights/lib/cache';
import { computeInsights } from '@/features/insights/lib/compute-insights';
import { readRedisInsights, writeRedisInsights } from '@/features/insights/lib/redis-cache';

export const dynamic = 'force-dynamic';

const DAY_MS = 86_400_000;
const MAX_SPAN_DAYS = 366;

function parseDate(value: string | null): Date | undefined | null {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
    let workspaceId: string | undefined;
    let userId: string | undefined;

    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;
        ({ workspaceId, userId } = access);

        const disabled = await aiAssistantDisabledResponse(workspaceId);
        if (disabled) return disabled;

        const url = new URL(req.url);
        const sp = url.searchParams;
        const force = sp.get('force') === '1' || sp.get('force') === 'true';

        const gte = parseDate(sp.get('gte'));
        const lt = parseDate(sp.get('lt'));
        const prevGte = parseDate(sp.get('prevGte'));
        const prevLt = parseDate(sp.get('prevLt'));
        if ([gte, lt, prevGte, prevLt].includes(null)) {
            return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
        }
        if (!gte || !lt) {
            return NextResponse.json({ error: 'gte and lt are required' }, { status: 400 });
        }
        const span = lt.getTime() - gte.getTime();
        if (span <= 0 || span > MAX_SPAN_DAYS * DAY_MS) {
            return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
        }

        const prevTo = prevLt ?? gte;
        const prevFrom = prevGte ?? new Date(prevTo.getTime() - span);
        if (prevFrom >= prevTo || prevTo > gte) {
            return NextResponse.json({ error: 'Invalid previous period' }, { status: 400 });
        }

        const key = rangeKey(gte, lt);

        // 1) Redis, then the database cache. Skip both when the client forces a refresh.
        if (!force) {
            const redisHit = await readRedisInsights(workspaceId, key);
            if (redisHit) return NextResponse.json(redisHit);

            const hit = await readInsights(workspaceId, key);
            if (hit) return NextResponse.json(hit);
        }

        // 2) Cache miss / forced refresh
        const body = await computeInsights(workspaceId, {
            from: gte,
            to: lt,
            prevFrom,
            prevTo,
        });

        // 3) Store (best-effort)
        await writeRedisInsights(workspaceId, key, body);
        await writeInsights(workspaceId, key, body, body.insights.length);

        return NextResponse.json(body);
    } catch (error) {
        console.error('AI insights failed:', error instanceof Error ? error.message : error);
        await captureRouteError(req, error, { status: 502, workspaceId, userId });
        const status = error instanceof GeminiConfigError ? 503 : 502;
        return NextResponse.json(
            { error: 'AI insights are unavailable right now' },
            { status },
        );
    }
}