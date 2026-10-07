import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { validateTransactionData } from '@/features/finance/lib/validate-transaction';
import { validateTransfer } from '@/features/finance/lib/validate-transfer';
import { getAccountError } from '@/features/accounts/lib/check-account';
import { getCategoryError } from '@/lib/categories';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

const TRANSACTION_INCLUDE = {
    category: { select: { id: true, name: true, color: true } },
    account: { select: { id: true, name: true, type: true, isActive: true } },
    toAccount: { select: { id: true, name: true } },
} as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireWorkspaceAccess(req, 'MEMBER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const { id } = await params;

        // Verify the transaction belongs to this workspace (returns 404 if not)
        const existing = await prisma.transaction.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const body = await req.json();

        // --- Transfer branch ---------------------------------------------------
        // A transaction can never switch between TRANSFER and non-TRANSFER.
        const isTransfer = existing.type === 'TRANSFER';
        if (isTransfer !== (body?.type === 'TRANSFER')) {
            return NextResponse.json(
                { error: 'A transfer cannot be converted to or from a normal transaction' },
                { status: 400 },
            );
        }

        if (isTransfer) {
            const parsed = validateTransfer(body);
            if (!parsed.ok) {
                return NextResponse.json({ error: parsed.error }, { status: 400 });
            }
            const { fromAccountId, toAccountId, amount, date, note } = parsed.data;

            const accounts = await prisma.financialAccount.findMany({
                where: {
                    id: { in: [fromAccountId, toAccountId] },
                    workspaceId,
                    isActive: true,
                },
                select: { id: true, currency: true },
            });
            if (accounts.length !== 2 || accounts[0].currency !== accounts[1].currency) {
                return NextResponse.json(
                    {
                        error: 'Both accounts must be active, same-currency accounts in this workspace',
                    },
                    { status: 400 },
                );
            }

            const updated = await prisma.transaction.update({
                where: { id: existing.id },
                data: {
                    amount,
                    description: note,
                    accountId: fromAccountId,
                    toAccountId,
                    createdAt: date,
                },
                include: {
                    account: { select: { id: true, name: true } },
                    toAccount: { select: { id: true, name: true } },
                },
            });

            const changes = {
                ...(existing.amount !== updated.amount
                    ? { amount: { before: existing.amount, after: updated.amount } }
                    : {}),
                ...(existing.description !== updated.description
                    ? { description: { before: existing.description, after: updated.description } }
                    : {}),
                ...(existing.accountId !== updated.accountId
                    ? { accountId: { before: existing.accountId, after: updated.accountId } }
                    : {}),
                ...(existing.toAccountId !== updated.toAccountId
                    ? { toAccountId: { before: existing.toAccountId, after: updated.toAccountId } }
                    : {}),
                ...(existing.createdAt.getTime() !== updated.createdAt.getTime()
                    ? { date: { before: existing.createdAt, after: updated.createdAt } }
                    : {}),
            };
            if (Object.keys(changes).length > 0) {
                await logAudit({
                    actor: await userActor(access.userId),
                    action: AUDIT_ACTIONS.TRANSFER_UPDATED,
                    resourceType: 'transaction',
                    resourceId: updated.id,
                    workspaceId,
                    metadata: { changes },
                });
            }

            return NextResponse.json(updated, { status: 200 });
        }
        // --- End transfer branch ----------------------------------------------

        // Merge existing with body for validation
        const mergedData = {
            amount: body.amount !== undefined ? body.amount : existing.amount,
            type: body.type !== undefined ? body.type : existing.type,
            description: body.description !== undefined ? body.description : existing.description,
            categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
            accountId: body.accountId !== undefined ? body.accountId : existing.accountId,
            date: body.date,
        };

        let validatedData;
        try {
            validatedData = validateTransactionData(mergedData);
        } catch (err: unknown) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : 'Invalid data' },
                { status: 400 },
            );
        }

        const { amount, type, description, categoryId, accountId, date } = validatedData;

        // Re-check when the category OR the type changed. Active is only required for a *new* category,
        // so old transactions on a since-deactivated category stay editable.
        if (categoryId && (categoryId !== existing.categoryId || type !== existing.type)) {
            const categoryError = await getCategoryError(categoryId, workspaceId, {
                type,
                requireActive: categoryId !== existing.categoryId,
            });
            if (categoryError) return NextResponse.json({ error: categoryError }, { status: 400 });
        }

        // Account rule:
        //  - unchanged account -> no check (old transactions on an inactive account stay editable)
        //  - changed account   -> must belong to this workspace AND be active
        if (accountId && accountId !== existing.accountId) {
            const accountError = await getAccountError(workspaceId, accountId, {
                requireActive: true,
            });
            if (accountError) {
                return NextResponse.json({ error: accountError }, { status: 400 });
            }
        }

        // The form only sends `date` when the user changed it, so apply it as given.
        const newCreatedAt = date;

        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                amount,
                type,
                description,
                categoryId: body.categoryId === null ? null : categoryId,
                accountId,
                ...(newCreatedAt && { createdAt: newCreatedAt }),
            },
            include: TRANSACTION_INCLUDE,
        });

        const changes = {
            ...(existing.amount !== updated.amount
                ? { amount: { before: existing.amount, after: updated.amount } }
                : {}),
            ...(existing.type !== updated.type
                ? { type: { before: existing.type, after: updated.type } }
                : {}),
            ...(existing.description !== updated.description
                ? { description: { before: existing.description, after: updated.description } }
                : {}),
            ...(existing.categoryId !== updated.categoryId
                ? { categoryId: { before: existing.categoryId, after: updated.categoryId } }
                : {}),
            ...(existing.accountId !== updated.accountId
                ? { accountId: { before: existing.accountId, after: updated.accountId } }
                : {}),
            ...(existing.createdAt.getTime() !== updated.createdAt.getTime()
                ? { date: { before: existing.createdAt, after: updated.createdAt } }
                : {}),
        };
        if (Object.keys(changes).length > 0) {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.TRANSACTION_UPDATED,
                resourceType: 'transaction',
                resourceId: updated.id,
                workspaceId,
                metadata: { changes },
            });
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error('Failed to update transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireWorkspaceAccess(req, 'MEMBER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const { id } = await params;

        // Verify the transaction belongs to this workspace (returns 404 if not)
        const existing = await prisma.transaction.findFirst({
            where: { id, workspaceId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.transaction.delete({ where: { id } });

        const action =
            existing.type === 'TRANSFER'
                ? AUDIT_ACTIONS.TRANSFER_DELETED
                : AUDIT_ACTIONS.TRANSACTION_DELETED;

        await logAudit({
            actor: await userActor(access.userId),
            action,
            resourceType: 'transaction',
            resourceId: existing.id,
            workspaceId,
            metadata: {
                type: existing.type,
                amount: existing.amount,
                targetName: existing.description,
            },
        });

        return NextResponse.json({ id }, { status: 200 });
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
