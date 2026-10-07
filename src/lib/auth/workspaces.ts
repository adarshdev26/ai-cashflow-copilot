import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUserId } from '@/lib/auth/auth';
import type { WorkspaceRole } from '@/generated/prisma';
import { canWorkspaceAction, type WorkspaceAction } from '@/features/workspaces/permissions';

export const WORKSPACE_HEADER = 'x-workspace-id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Higher number = more power. Lets us say "at least MEMBER" instead of listing roles.
const ROLE_RANK: Record<WorkspaceRole, number> = {
    VIEWER: 1,
    MEMBER: 2,
    ADMIN: 3,
    OWNER: 4,
};

export function hasRole(actual: WorkspaceRole, minimum: WorkspaceRole): boolean {
    return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}

export type WorkspaceAccessResult =
    | { ok: true; userId: string; workspaceId: string; role: WorkspaceRole }
    | { ok: false; response: NextResponse };

const fail = (error: string, status: number): WorkspaceAccessResult => ({
    ok: false,
    response: NextResponse.json({ error }, { status }),
});

/**
 * Call at the top of every workspace-scoped API route.
 *   VIEWER = read, MEMBER = write, ADMIN = manage access, OWNER = delete/transfer
 * The header only says WHICH workspace the client wants. The database lookup
 * below decides whether this user may use it.
 */
export async function requireWorkspaceAccess(
    req: Request,
    minimumRole: WorkspaceRole = 'VIEWER',
    urlWorkspaceId?: string,
): Promise<WorkspaceAccessResult> {
    const userId = await requireUserId();
    if (!userId) return fail('Unauthorized', 401);

    const headerId = req.headers.get(WORKSPACE_HEADER);
    if (urlWorkspaceId && headerId && urlWorkspaceId !== headerId) {
        return fail('Workspace ID in URL does not match header', 400);
    }
    const workspaceId = urlWorkspaceId || headerId;

    if (!workspaceId || !UUID_RE.test(workspaceId)) {
        return fail('A valid workspace ID is required', 400);
    }

    // One indexed lookup using @@unique([workspaceId, userId])
    const membership = await prisma.workspaceAccess.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { role: true, workspace: { select: { isActive: true } } },
    });

    if (!membership) return fail('You do not have access to this workspace', 403);
    if (!membership.workspace.isActive) return fail('This workspace has been deactivated', 403);
    if (!hasRole(membership.role, minimumRole)) {
        return fail('Your role does not allow this action', 403);
    }

    return { ok: true, userId, workspaceId, role: membership.role };
}

/**
 * Preferred guard for routes: checks a named action instead of a rank.
 * The underlying call only proves membership (every role can read);
 * the action check is what decides.
 */
export async function requireWorkspaceAction(
    req: Request,
    action: WorkspaceAction,
    urlWorkspaceId?: string,
): Promise<WorkspaceAccessResult> {
    const access = await requireWorkspaceAccess(req, 'VIEWER', urlWorkspaceId);
    if (!access.ok) return access;
    if (!canWorkspaceAction(access.role, action)) {
        return fail('Your role does not allow this action', 403);
    }
    return access;
}

export type WorkspaceSummary = {
    workspaceId: string;
    role: WorkspaceRole;
    name: string;
    slug: string;
    ownerEmail: string | null;
};

/** Every workspace the user can open (owned + shared). Uses the userId index. */
export async function getUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const rows = await prisma.workspaceAccess.findMany({
        where: { userId, workspace: { isActive: true } },
        select: {
            role: true,
            workspace: {
                select: { id: true, name: true, slug: true, owner: { select: { email: true } } },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => ({
        workspaceId: r.workspace.id,
        role: r.role,
        name: r.workspace.name,
        slug: r.workspace.slug,
        ownerEmail: r.workspace.owner?.email ?? null,
    }));
}

export function generateWorkspaceSlug(name: string): string {
    const base =
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'workspace';
    return `${base}-${randomUUID().slice(0, 8)}`;
}
