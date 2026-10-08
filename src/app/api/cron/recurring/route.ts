import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { processSchedule } from '@/lib/recurring/create-recurring-occurrence';
import { cleanupResetTokens } from '@/lib/auth/cleanup';
import { logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { pruneErrorLogs } from '@/lib/admin/errors';
import { CRON_JOBS, recordCronRun } from '@/lib/admin/cron-heartbeat';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startedAt = Date.now();
    const due = await prisma.recurringTransaction.findMany({
        where: { isActive: true, nextRunAt: { lte: now } },
        orderBy: { nextRunAt: 'asc' },
        take: 200,
    });

    let generated = 0,
        skipped = 0,
        failed = 0;
    for (const s of due) {
        try {
            const r = await processSchedule(s, now);
            generated += r.generated;
            if (r.skipped) skipped++;
        } catch (e) {
            failed++;
            console.error('recurring failed', s.id, e);
            await prisma.recurringTransaction
                .update({
                    where: { id: s.id },
                    data: { lastError: 'Unexpected error, will retry' },
                })
                .catch((err) => console.error('recurring: failed to persist lastError', s.id, err));
        }
    }

    // Housekeeping runs last and never fails the recurring run.
    let resetTokensDeleted = 0;
    try {
        resetTokensDeleted = await cleanupResetTokens();
    } catch (e) {
        console.error('cron cleanup failed', e);
    }

    let errorLogsPruned = 0;
    try {
        errorLogsPruned = await pruneErrorLogs();
    } catch (e) {
        console.error('cron error-log prune failed', e);
    }

    if (due.length > 0) {
        await logAudit({
            actor: { type: 'SYSTEM' },
            action: AUDIT_ACTIONS.RECURRING_PROCESSED,
            resourceType: 'recurring',
            metadata: {
                processedCount: due.length,
                generatedCount: generated,
                skippedCount: skipped,
                failedCount: failed,
            },
        });
    }

    await recordCronRun(CRON_JOBS.recurring, {
        status: failed > 0 ? 'partial' : 'ok',
        durationMs: Date.now() - startedAt,
        processed: due.length,
        generated,
        failed,
    });

    return NextResponse.json({
        processed: due.length,
        generated,
        skipped,
        failed,
        resetTokensDeleted,
        errorLogsPruned,
    });
}

export const GET = handle; // Vercel Cron sends GET
export const POST = handle; // for manual/other schedulers
