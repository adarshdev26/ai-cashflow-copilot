import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { canWorkspaceAction } from '@/features/workspaces/permissions';
import { Prisma } from '@/generated/prisma';
import { validateUpdateAccount } from '@/features/accounts/lib/validate-account';
import { getAccountTotals, toAccountWithBalance } from '@/features/accounts/lib/balance';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ accountId: string }> };

const withCount = {
    _count: { select: { transactions: true, incomingTransfers: true } },
} as const;

export async function GET(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'workspace.read');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const { accountId } = await params;

        // Scoped by workspaceId: another workspace's id looks the same as a missing one
        const account = await prisma.financialAccount.findFirst({
            where: { id: accountId, workspaceId },
            include: withCount,
        });
        if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const totals = await getAccountTotals(workspaceId, [account.id]);
        return NextResponse.json(toAccountWithBalance(account, totals), { status: 200 });
    } catch (error) {
        console.error('Failed to fetch account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'account.update');
        if (!access.ok) return access.response;

        const { workspaceId, role } = access;
        const { accountId } = await params;

        const existing = await prisma.financialAccount.findFirst({
            where: { id: accountId, workspaceId },
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json().catch(() => null);
        let data;
        try {
            data = validateUpdateAccount(body);
        } catch (err: unknown) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : 'Invalid account data' },
                { status: 400 },
            );
        }

        if (data.isActive !== undefined && !canWorkspaceAction(role, 'account.deactivate')) {
            return NextResponse.json(
                { error: 'Your role does not allow this action' },
                { status: 403 },
            );
        }

        if (data.isActive === false && existing.isActive) {
            const activeSchedules = await prisma.recurringTransaction.count({
                where: { accountId, workspaceId, isActive: true },
            });
            if (activeSchedules > 0) {
                return NextResponse.json(
                    {
                        error: `This account is used by ${activeSchedules} active recurring schedule${activeSchedules === 1 ? '' : 's'}. Pause or delete them before deactivating the account.`,
                    },
                    { status: 409 },
                );
            }
        }

        if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
            const duplicate = await prisma.financialAccount.findFirst({
                where: {
                    workspaceId,
                    id: { not: accountId },
                    name: { equals: data.name, mode: 'insensitive' },
                },
                select: { id: true },
            });
            if (duplicate) {
                return NextResponse.json(
                    { error: 'An account with this name already exists' },
                    { status: 409 },
                );
            }
        }

        const updated = await prisma.financialAccount.update({
            where: { id: accountId },
            data,
            include: withCount,
        });

        const changes = {
            ...(existing.name !== updated.name
                ? { name: { before: existing.name, after: updated.name } }
                : {}),
            ...(existing.type !== updated.type
                ? { type: { before: existing.type, after: updated.type } }
                : {}),
            ...(existing.classification !== updated.classification
                ? {
                      classification: {
                          before: existing.classification,
                          after: updated.classification,
                      },
                  }
                : {}),
            ...(existing.isActive !== updated.isActive
                ? { isActive: { before: existing.isActive, after: updated.isActive } }
                : {}),
            ...(existing.currency !== updated.currency
                ? { currency: { before: existing.currency, after: updated.currency } }
                : {}),
        };
        if (Object.keys(changes).length > 0) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.ACCOUNT_UPDATED,
                resourceType: 'account',
                resourceId: updated.id,
                workspaceId,
                metadata: { targetName: updated.name, changes },
            });
        }

        const totals = await getAccountTotals(workspaceId, [accountId]);
        return NextResponse.json(toAccountWithBalance(updated, totals), { status: 200 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json(
                { error: 'An account with this name already exists' },
                { status: 409 },
            );
        }
        console.error('Failed to update account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: Ctx) {
    try {
        const access = await requireWorkspaceAction(req, 'account.deactivate');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const { accountId } = await params;

        const existing = await prisma.financialAccount.findFirst({
            where: { id: accountId, workspaceId },
            select: { id: true, name: true },
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Count both outgoing (accountId) and incoming (toAccountId) transfers, so a
        // transfer-only account can't be hard-deleted and orphan its transfers.
        const txCount = await prisma.transaction.count({
            where: {
                workspaceId,
                OR: [{ accountId }, { toAccountId: accountId }],
            },
        });
        if (txCount > 0) {
            return NextResponse.json(
                {
                    error: 'This account has transactions and cannot be deleted. Deactivate it instead.',
                },
                { status: 409 },
            );
        }

        const scheduleCount = await prisma.recurringTransaction.count({
            where: { accountId, workspaceId },
        });
        if (scheduleCount > 0) {
            return NextResponse.json(
                {
                    error: `This account is used by ${scheduleCount} recurring schedule${scheduleCount === 1 ? '' : 's'}. Delete them first.`,
                },
                { status: 409 },
            );
        }

        await prisma.financialAccount.delete({ where: { id: accountId } });
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.ACCOUNT_DELETED,
            resourceType: 'account',
            resourceId: existing.id,
            workspaceId,
            metadata: { targetName: existing.name },
        });
        return NextResponse.json({ id: accountId }, { status: 200 });
    } catch (error) {
        // FK Restrict fired because a transaction or recurring schedule was added between the count and the delete
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json(
                {
                    error: 'This account is still used by transactions or recurring schedules and cannot be deleted. Deactivate it instead.',
                },
                { status: 409 },
            );
        }
        console.error('Failed to delete account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
