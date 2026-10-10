import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { captureRouteError } from '@/lib/admin/errors';
import { CRON_JOBS, recordCronRun } from '@/lib/admin/cron-heartbeat';
import { GeminiConfigError } from '@/lib/gemini';
import { rangeKey } from '@/features/insights/lib/cache';
import { computeInsights } from '@/features/insights/lib/compute-insights';
import { getInsightsRange } from '@/features/insights/lib/range';
import { writeRedisInsights } from '@/features/insights/lib/redis-cache';
import { isAiAssistantEnabled } from '@/lib/settings/ai-assistant';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_WORKSPACES = 100;

async function handle(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startedAt = Date.now();
    let processed = 0;
    let cached = 0;
    let skipped = 0;
    let failed = 0;
    let lastError: unknown;

    try {
        const workspaces = await prisma.workspace.findMany({
            where: { isActive: true },
            select: { id: true },
            orderBy: { updatedAt: 'desc' },
            take: MAX_WORKSPACES,
        });
        processed = workspaces.length;

        const range = getInsightsRange(new Date());
        const from = new Date(range.gte);
        const to = new Date(range.lt);
        const prevFrom = new Date(range.prevGte);
        const prevTo = new Date(range.prevLt);
        const key = rangeKey(from, to);

        for (const workspace of workspaces) {
            try {
                if (!(await isAiAssistantEnabled(workspace.id))) {
                    skipped++;
                    continue;
                }
                const body = await computeInsights(workspace.id, { from, to, prevFrom, prevTo });
                const stored = await writeRedisInsights(workspace.id, key, body);
                if (!stored) {
                    failed++;
                    continue;
                }
                cached++;
                if (body.insights.length === 0) skipped++;
            } catch (error) {
                failed++;
                lastError = error;
                console.error(
                    'insights cron failed',
                    workspace.id,
                    error instanceof Error ? error.message : error,
                );
                if (error instanceof GeminiConfigError) break;
            }
        }

        await recordCronRun(CRON_JOBS.insights, {
            status: failed > 0 ? 'partial' : 'ok',
            durationMs: Date.now() - startedAt,
            processed,
            generated: cached,
            failed,
        });

        if (failed > 0 && cached === 0) {
            const status = lastError instanceof GeminiConfigError ? 503 : 502;
            await captureRouteError(req, lastError ?? new Error('Insights precompute failed'), {
                status,
            });
            return NextResponse.json(
                { error: 'Insights precompute failed', processed, cached, skipped, failed },
                { status },
            );
        }

        return NextResponse.json({ processed, cached, skipped, failed });
    } catch (error) {
        console.error('insights cron failed:', error instanceof Error ? error.message : error);
        await captureRouteError(req, error, { status: 500 });
        return NextResponse.json({ error: 'Insights precompute failed' }, { status: 500 });
    }
}

export const GET = handle;
export const POST = handle;
