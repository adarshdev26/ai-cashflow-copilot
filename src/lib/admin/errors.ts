import 'server-only';
import { prisma } from '@/lib/db/prisma';

export const ERROR_LOG_RETENTION_DAYS = 30;

const MAX_MESSAGE = 300;
const UUID_SEGMENT = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;
const CUID_SEGMENT = /\/c[a-z0-9]{24}(?=\/|$)/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export type ApiErrorCapture = {
    method: string;
    path: string;
    status: number;
    message: string;
    errorName?: string | null;
    workspaceId?: string | null;
    userId?: string | null;
    latencyMs?: number | null;
};

/** No query string, ids replaced: /api/finance/transactions/<uuid> -> /api/finance/transactions/[id] */
export function sanitizePath(raw: string): string {
    return raw
        .split('?')[0]
        .replace(UUID_SEGMENT, '/[id]')
        .replace(CUID_SEGMENT, '/[id]')
        .slice(0, 512);
}

/**
 * Prisma error messages embed the query arguments (amounts, descriptions...), so for
 * Prisma errors we keep only the class name + code. Other errors: first line, no emails.
 */
function describeError(error: unknown): { name: string; message: string } {
    if (error instanceof Error) {
        const name = error.name || 'Error';
        if (name.startsWith('PrismaClient')) {
            const code = (error as { code?: unknown }).code;
            return { name, message: typeof code === 'string' ? `${name} (${code})` : name };
        }
        const firstLine = error.message.split('\n')[0] ?? '';
        return { name, message: firstLine.replace(EMAIL, '[email]').slice(0, MAX_MESSAGE) || name };
    }
    return { name: 'UnknownError', message: 'Unknown error' };
}

/** Best-effort write. NEVER throws, so it can't break the request that failed. Always await it. */
export async function captureApiError(input: ApiErrorCapture): Promise<void> {
    try {
        await prisma.errorLog.create({
            data: {
                method: input.method.slice(0, 16),
                path: sanitizePath(input.path),
                status: input.status,
                message: input.message.slice(0, MAX_MESSAGE),
                errorName: input.errorName?.slice(0, 100) ?? null,
                workspaceId: input.workspaceId ?? null,
                userId: input.userId ?? null,
                latencyMs: input.latencyMs ?? null,
            },
        });
    } catch (err) {
        console.error(
            '[error-log] write failed:',
            err instanceof Error ? err.message : 'unknown error',
        );
    }
}

/** One-liner for route catch blocks: `await captureRouteError(req, error);` */
export async function captureRouteError(
    req: Request,
    error: unknown,
    opts: { status?: number; workspaceId?: string | null; userId?: string | null } = {},
): Promise<void> {
    const { name, message } = describeError(error);
    await captureApiError({
        method: req.method,
        path: new URL(req.url).pathname,
        status: opts.status ?? 500,
        message,
        errorName: name,
        workspaceId: opts.workspaceId,
        userId: opts.userId,
    });
}

/** Deletes rows older than the retention window. Called from the existing cron. */
export async function pruneErrorLogs(): Promise<number> {
    const cutoff = new Date(Date.now() - ERROR_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await prisma.errorLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    return count;
}