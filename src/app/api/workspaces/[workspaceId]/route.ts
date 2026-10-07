import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { canWorkspaceAction } from '@/features/workspaces/permissions';
import { getSystemNumber } from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'VIEWER', workspaceId);
        if (!access.ok) return access.response;

        const workspace = await prisma.workspace.findUnique({
            where: { id: access.workspaceId },
            include: canWorkspaceAction(access.role, 'members.view')
                ? { access: { include: { user: { select: { id: true, email: true } } } } }
                : undefined,
        });

        if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Failed to get workspace:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string }> },
) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId);
        if (!access.ok) return access.response;

        const body = await req.json();
        const [minLength, maxLength] = await Promise.all([
            getSystemNumber('limits.workspaceNameMinLength'),
            getSystemNumber('limits.workspaceNameMaxLength'),
        ]);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (name.length < minLength || name.length > maxLength) {
            return NextResponse.json(
                { error: `Workspace name must be ${minLength}-${maxLength} characters` },
                { status: 400 },
            );
        }

        const existing = await prisma.workspace.findUnique({
            where: { id: access.workspaceId },
            select: { name: true },
        });
        const workspace = await prisma.workspace.update({
            where: { id: access.workspaceId },
            data: { name },
        });

        if (existing?.name !== workspace.name) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.WORKSPACE_UPDATED,
                resourceType: 'workspace',
                resourceId: workspace.id,
                workspaceId: workspace.id,
                metadata: {
                    before: { name: existing?.name ?? null },
                    after: { name: workspace.name },
                },
            });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Failed to update workspace:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ workspaceId: string }> },
) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'OWNER', workspaceId);
        if (!access.ok) return access.response;

        const existing = await prisma.workspace.findUnique({
            where: { id: access.workspaceId },
            select: { id: true, name: true },
        });
        const [transactionCount, recurringCount, budgetCount] = await Promise.all([
            prisma.transaction.count({ where: { workspaceId: access.workspaceId } }),
            prisma.recurringTransaction.count({ where: { workspaceId: access.workspaceId } }),
            prisma.budget.count({ where: { workspaceId: access.workspaceId } }),
        ]);
        await prisma.workspace.delete({
            where: { id: access.workspaceId },
        });

        if (existing) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.WORKSPACE_DELETED,
                resourceType: 'workspace',
                resourceId: existing.id,
                workspaceId: existing.id,
                metadata: {
                    targetName: existing.name,
                    deletedCounts: {
                        transactions: transactionCount,
                        recurring: recurringCount,
                        budgets: budgetCount,
                    },
                },
            });
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Failed to delete workspace:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
