import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/generated/prisma';
import type { AuditAction, AuditResourceType } from '@/lib/admin/audit-events';

export type AuditActor = {
    type: 'ADMIN' | 'USER' | 'SYSTEM';
    id?: string | null;
    name?: string | null;
    email?: string | null;
};

export type LogAuditInput = {
    actor: AuditActor;
    action: AuditAction;
    resourceType: AuditResourceType;
    resourceId?: string | null;
    workspaceId?: string | null;
    metadata?: Record<string, unknown>;
    /** Pass the incoming request only where you want ip/userAgent stored (signup, admin actions). */
    request?: Request;
};

const SENSITIVE_KEY = /pass(word)?|token|secret|hash|authorization|cookie/i;

function redact(value: unknown, depth = 0): unknown {
    if (depth > 5) return '[truncated]';
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [
                k,
                SENSITIVE_KEY.test(k) ? '[redacted]' : redact(v, depth + 1),
            ]),
        );
    }
    return value;
}

function getRequestContext(request: Request) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = forwarded || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent')?.slice(0, 255) ?? null;
    return { ip, userAgent };
}

/** Builds the actor snapshot for the logged-in admin (requireAdmin only returns adminId). */
export async function adminActor(adminId: string): Promise<AuditActor> {
    try {
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: { name: true, email: true },
        });
        return {
            type: 'ADMIN',
            id: adminId,
            name: admin?.name ?? null,
            email: admin?.email ?? null,
        };
    } catch {
        return { type: 'ADMIN', id: adminId };
    }
}

/** Builds the actor snapshot for a signed-in user when a route only has their id. */
export async function userActor(userId: string): Promise<AuditActor> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });
        return { type: 'USER', id: userId, name: user?.name ?? null, email: user?.email ?? null };
    } catch {
        return { type: 'USER', id: userId };
    }
}

/**
 * Best-effort audit write. NEVER throws, so it can't break the main action.
 * Always `await` it in route handlers; un-awaited promises can be dropped on serverless.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
    try {
        const ctx = input.request
            ? getRequestContext(input.request)
            : { ip: null, userAgent: null };
        await prisma.auditLog.create({
            data: {
                actorId: input.actor.id ?? null,
                actorType: input.actor.type,
                actorName: input.actor.name ?? null,
                actorEmail: input.actor.email ?? null,
                action: input.action,
                resourceType: input.resourceType,
                resourceId: input.resourceId ?? null,
                workspaceId: input.workspaceId ?? null,
                metadata: input.metadata
                    ? (redact(input.metadata) as Prisma.InputJsonValue)
                    : undefined,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
            },
        });
    } catch (err) {
        // Log only the action and error message, never the metadata.
        console.error(
            '[audit] write failed:',
            input.action,
            err instanceof Error ? err.message : 'unknown error',
        );
    }
}
