import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { captureRouteError } from '@/lib/admin/errors';
import { GeminiConfigError } from '@/lib/gemini';
import { getFinancialAnalytics } from '@/features/insights/lib/financial-analytics';
import { buildCandidates } from '@/features/insights/lib/candidates';
import { generateInsights } from '@/features/insights/lib/generate-insights';
import { readInsights, writeInsights, rangeKey } from '@/features/insights/lib/cache';
import type { InsightsResponse } from '@/features/insights/types';

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

        const url = new URL(req.url);
        const sp = url.searchParams;
        const force = sp.get('force') === '1';

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

        // 1) Cache hit
        if (!force) {
            const hit = await readInsights(workspaceId, key);
            if (hit) return NextResponse.json(hit);
        }

        // 2) Cache miss / forced refresh
        const analytics = await getFinancialAnalytics(workspaceId, {
            from: gte,
            to: lt,
            prevFrom,
            prevTo,
        });

        const candidates =
            analytics.current.count === 0 ? [] : buildCandidates(analytics);

        const body: InsightsResponse = {
            insights: [],
            generatedAt: new Date().toISOString(),
            period: { from: gte.toISOString(), to: lt.toISOString() },
            cached: false,
        };

        if (candidates.length > 0) {
            body.insights = await generateInsights(candidates, analytics.currency);
        }

        // 3) Store (best-effort)
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