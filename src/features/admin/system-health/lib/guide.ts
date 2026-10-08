import 'server-only';
import { ERROR_LOG_RETENTION_DAYS } from '@/lib/admin/errors';
import type { HealthGuide, ServiceHealthStatus, ServiceId, ServiceInfo } from '../types';
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
    STATUS_REFRESH_MS,
} from './constants';

// ---------------------------------------------------------------------------
// HOW TO EDIT THIS FILE
//  - Text is built from constants.ts, so numbers here always match the real rules.
//  - To add a service: add an entry to SERVICE_GUIDE (same id as in checks.ts).
//  - `actions` = advice shown for the current status. Missing status -> DEFAULT_ACTIONS.
// ---------------------------------------------------------------------------

type ServiceGuide = Omit<ServiceInfo, 'nextStep'> & {
    actions: Partial<Record<ServiceHealthStatus, string>>;
};

const DEFAULT_ACTIONS: Record<ServiceHealthStatus, string> = {
    healthy: 'Nothing to do.',
    degraded: 'It still works, but keep an eye on it and look at the details above.',
    down: 'Fix this first. Check your hosting logs and environment settings.',
    not_configured: 'This feature is not set up yet. Nothing is broken.',
    unknown: 'Press Refresh. If it stays Unknown, check the server logs.',
};

const cronStaleHours = CRON_EXPECTED_INTERVAL_HOURS * CRON_STALE_FACTOR;
const cronDownHours = CRON_EXPECTED_INTERVAL_HOURS * CRON_DOWN_FACTOR;

const SERVICE_GUIDE: Record<ServiceId, ServiceGuide> = {
    api: {
        what: 'The server that answers every request from the app (transactions, reports, logins).',
        how: [
            'We look at the saved error list.',
            `We count server errors (500 and above) from the last ${HEALTH_WINDOW_MINUTES} minutes.`,
            'Only routes that save their errors are counted.',
        ],
        degradedWhen: `${API_ERRORS_DEGRADED} or more server errors in ${HEALTH_WINDOW_MINUTES} minutes`,
        downWhen: `${API_ERRORS_DOWN} or more server errors in ${HEALTH_WINDOW_MINUTES} minutes`,
        actions: {
            degraded:
                'Scroll to Recent errors, filter by "Server errors (5xx)" and find the endpoint that keeps failing.',
            down: 'Many requests are failing right now. Check Recent errors and your hosting logs immediately.',
        },
    },
    database: {
        what: 'Where all the data is stored (users, accounts, transactions).',
        how: [
            'We send the database a tiny test question (SELECT 1).',
            'We measure how long the answer takes.',
        ],
        degradedWhen: `The answer takes more than ${DB_SLOW_MS} ms`,
        downWhen: 'The test question fails',
        actions: {
            degraded:
                'The database is busy or slow. Look for heavy queries or check your database provider dashboard.',
            down: 'The app cannot reach the database. Check DATABASE_URL and your database provider status.',
        },
    },
    auth: {
        what: 'Login and sessions for users and admins.',
        how: [
            'We check that the secret keys (JWT_SECRET and ADMIN_JWT_SECRET) are set.',
            `We count failed logins from the last ${HEALTH_WINDOW_MINUTES} minutes.`,
        ],
        degradedWhen: `${LOGIN_FAILURES_DEGRADED} or more failed logins in ${HEALTH_WINDOW_MINUTES} minutes`,
        downWhen: 'A secret key is missing, so logins cannot work',
        actions: {
            degraded:
                'Many wrong passwords. It may be forgotten passwords or someone guessing. Check Audit logs for "login failed".',
            down: 'Add the missing secret in your environment variables and redeploy.',
        },
    },
    cron: {
        what: 'A job that runs once a day. It creates your recurring transactions and deletes old data.',
        how: [
            'Each time the job runs, it saves the time it ran.',
            'We check how long ago that was.',
            'We also check if any recurring schedule has an error.',
        ],
        degradedWhen: `It did not run for more than ${cronStaleHours} hours (about 1 missed day), or a schedule has an error, or CRON_SECRET is missing`,
        downWhen: `It did not run for more than ${cronDownHours} hours (about 3 missed days)`,
        actions: {
            degraded:
                'The job is late or a schedule has an error. Check the Recurring page for errors, and make sure CRON_SECRET is set.',
            down: 'The job has stopped. Check the Vercel cron logs and run it once by hand.',
            unknown:
                'The job has not run since this check was added. Run it once by hand, or wait for the next daily run.',
        },
    },
};

/** Info for one card, with advice picked for its current status. */
export function getServiceInfo(id: ServiceId, status: ServiceHealthStatus): ServiceInfo {
    const { actions, ...rest } = SERVICE_GUIDE[id];
    return { ...rest, nextStep: actions[status] ?? DEFAULT_ACTIONS[status] };
}

/** Page-level explanation, sent with every status response. */
export const HEALTH_GUIDE: HealthGuide = {
    howItWorks: [
        `Every ${STATUS_REFRESH_MS / 1000} seconds this page asks the server to run ${Object.keys(SERVICE_GUIDE).length} quick checks.`,
        `Each check gets ${CHECK_TIMEOUT_MS / 1000} seconds. If it is too slow it shows Unknown, so the page never freezes.`,
        'When a request fails, the server saves a short safe note (no passwords, no emails, no amounts) in the error list.',
        `Every day the cron job deletes error notes older than ${ERROR_LOG_RETENTION_DAYS} days.`,
    ],
    statuses: [
        { status: 'healthy', label: 'Healthy', meaning: 'Everything is working normally.' },
        {
            status: 'degraded',
            label: 'Degraded',
            meaning: 'Still working, but something is off. Take a look soon.',
        },
        { status: 'down', label: 'Down', meaning: 'Broken, or very badly affected. Act now.' },
        {
            status: 'unknown',
            label: 'Unknown',
            meaning: 'The check could not run, or there is no data yet.',
        },
    ],
    errorCodes: [
        {
            code: '5xx (500, 502...)',
            meaning:
                'The server failed while handling a request. Usually a bug or a broken service.',
        },
        {
            code: '429',
            meaning: 'Too many requests. Someone hit a rate limit.',
        },
        {
            code: '4xx (400, 403...)',
            meaning: 'The request was wrong or not allowed. Usually not a server problem.',
        },
    ],
    limits: [
        'API health counts recent server errors. It is not a true error rate, because we do not count all requests.',
        'Only routes that save their errors appear in the Recent errors table.',
    ],
};
