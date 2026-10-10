import 'server-only';
import { prisma } from '@/lib/db/prisma';

export const CRON_JOBS = { recurring: 'recurring', insights: 'insights' } as const;

export type CronRun = {
    status: 'ok' | 'partial';
    durationMs: number;
    processed: number;
    generated: number;
    failed: number;
};

/** Best-effort. NEVER throws, so it can't fail the cron run. */
export async function recordCronRun(job: string, run: CronRun): Promise<void> {
    try {
        const lastRunAt = new Date();
        await prisma.cronHeartbeat.upsert({
            where: { job },
            create: { job, lastRunAt, ...run },
            update: { lastRunAt, ...run },
        });
    } catch (err) {
        console.error(
            '[cron] heartbeat write failed:',
            err instanceof Error ? err.message : 'unknown error',
        );
    }
}
