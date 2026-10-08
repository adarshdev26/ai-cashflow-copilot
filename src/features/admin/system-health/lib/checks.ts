import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { CRON_JOBS } from '@/lib/admin/cron-heartbeat';
import type { ServiceId, ServiceStatus } from '../types';
import {
    API_ERRORS_DEGRADED,
    API_ERRORS_DOWN,
    CHECK_TIMEOUT_MS,
    CRON_DOWN_FACTOR,
    CRON_EXPECTED_INTERVAL_HOURS,
    CRON_STALE_FACTOR,
    DB_SLOW_MS,
    HEALTH_WINDOW_MINUTES,
    LOGIN_FAILURES_DEGRADED,
} from './constants';
import { getServiceInfo } from './guide';

type CheckResult = Pick<ServiceStatus, 'status' | 'detail' | 'latencyMs' | 'lastIncidentAt'>;
type HealthCheck = {
    id: ServiceId;
    name: string;
    timeoutMs: number;
    run: () => Promise<CheckResult>;
};

class CheckTimeoutError extends Error { }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CheckTimeoutError('timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function result(
    status: CheckResult['status'],
    detail: string,
    extra: { latencyMs?: number; lastIncidentAt?: string | null } = {},
): CheckResult {
    return {
        status,
        detail,
        latencyMs: extra.latencyMs ?? null,
        lastIncidentAt: extra.lastIncidentAt ?? null,
    };
}

function formatAgo(hours: number): string {
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
    if (hours < 48) return `${Math.round(hours)} h`;
    return `${Math.round(hours / 24)} days`;
}

const windowStart = () => new Date(Date.now() - HEALTH_WINDOW_MINUTES * 60_000);

async function checkDatabase(): Promise<CheckResult> {
    const t0 = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        return result('down', 'Database query failed');
    }
    const ms = Date.now() - t0;
    return ms > DB_SLOW_MS
        ? result('degraded', `Responding slowly (${ms} ms)`, { latencyMs: ms })
        : result('healthy', `Connected in ${ms} ms`, { latencyMs: ms });
}

async function checkApi(): Promise<CheckResult> {
    const [count, last] = await Promise.all([
        prisma.errorLog.count({
            where: { status: { gte: 500 }, createdAt: { gte: windowStart() } },
        }),
        prisma.errorLog.findFirst({
            where: { status: { gte: 500 } },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        }),
    ]);
    const lastIncidentAt = last?.createdAt.toISOString() ?? null;
    const window = `in the last ${HEALTH_WINDOW_MINUTES} min`;
    if (count >= API_ERRORS_DOWN) {
        return result('down', `${count} server errors ${window}`, { lastIncidentAt });
    }
    if (count >= API_ERRORS_DEGRADED) {
        return result('degraded', `${count} server error${count === 1 ? '' : 's'} ${window}`, {
            lastIncidentAt,
        });
    }
    return result('healthy', `No server errors ${window}`, { lastIncidentAt });
}

async function checkAuth(): Promise<CheckResult> {
    if (!process.env.JWT_SECRET || !process.env.ADMIN_JWT_SECRET) {
        return result('down', 'Signing secret missing, logins will fail');
    }
    const failures = await prisma.auditLog.count({
        where: {
            action: { in: ['user.login_failed', 'admin.login_failed'] },
            createdAt: { gte: windowStart() },
        },
    });
    const window = `in the last ${HEALTH_WINDOW_MINUTES} min`;
    return failures >= LOGIN_FAILURES_DEGRADED
        ? result('degraded', `${failures} failed logins ${window}`)
        : result('healthy', `Secrets configured · ${failures} failed logins ${window}`);
}

async function checkCron(): Promise<CheckResult> {
    if (!process.env.CRON_SECRET) {
        return result('degraded', 'CRON_SECRET not set, cron requests are rejected');
    }
    const [heartbeat, failing] = await Promise.all([
        prisma.cronHeartbeat.findUnique({ where: { job: CRON_JOBS.recurring } }),
        prisma.recurringTransaction.count({
            where: { isActive: true, lastError: { not: null } },
        }),
    ]);
    if (!heartbeat) return result('unknown', 'No run recorded yet');

    const ageHours = (Date.now() - heartbeat.lastRunAt.getTime()) / 3_600_000;
    const ago = formatAgo(ageHours);
    if (ageHours > CRON_EXPECTED_INTERVAL_HOURS * CRON_DOWN_FACTOR) {
        return result('down', `No run for ${ago}`);
    }
    if (ageHours > CRON_EXPECTED_INTERVAL_HOURS * CRON_STALE_FACTOR) {
        return result('degraded', `Last run ${ago} ago, overdue`);
    }
    if (heartbeat.status !== 'ok' || failing > 0) {
        return result(
            'degraded',
            `Last run ${ago} ago · ${failing} schedule${failing === 1 ? '' : 's'} with errors`,
        );
    }
    return result('healthy', `Last run ${ago} ago · ${heartbeat.generated} generated`);
}

// To add Email / Gemini / Storage later, add one entry here and one icon in ServiceStatusCard.
const HEALTH_CHECKS: HealthCheck[] = [
    { id: 'api', name: 'API', timeoutMs: CHECK_TIMEOUT_MS, run: checkApi },
    { id: 'database', name: 'Database', timeoutMs: CHECK_TIMEOUT_MS, run: checkDatabase },
    { id: 'auth', name: 'Authentication', timeoutMs: CHECK_TIMEOUT_MS, run: checkAuth },
    { id: 'cron', name: 'Cron jobs', timeoutMs: CHECK_TIMEOUT_MS, run: checkCron },
];

async function runOne(check: HealthCheck): Promise<ServiceStatus> {
    const base = { id: check.id, name: check.name, checkedAt: new Date().toISOString() };
    let outcome: CheckResult;
    try {
        outcome = await withTimeout(check.run(), check.timeoutMs);
    } catch (e) {
        const timedOut = e instanceof CheckTimeoutError;
        outcome = result('unknown', timedOut ? 'Check timed out' : 'Check could not run');
    }
    // `info` = plain-language explanation for the admin (what / how / rules / next step)
    return { ...base, ...outcome, info: getServiceInfo(check.id, outcome.status) };
}

/** Runs every check in parallel. Never throws: a failing check becomes status "unknown". */
export function runHealthChecks(): Promise<ServiceStatus[]> {
    return Promise.all(HEALTH_CHECKS.map(runOne));
}