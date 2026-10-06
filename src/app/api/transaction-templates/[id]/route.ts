import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/generated/prisma';
import { templateAccess } from '@/lib/template-access';
import { getAccountError } from '@/features/accounts/lib/check-account';
import { getCategoryError } from '@/lib/categories';
import {
    validateTemplateInput,
    isTemplateNameTaken,
} from '@/features/transaction-templates/lib/validate-transaction-template';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

const TEMPLATE_INCLUDE = {
    account: { select: { id: true, name: true, isActive: true } },
    category: { select: { id: true, name: true, color: true, isActive: true } },
} as const;

export async function PATCH(request: Request, { params }: Ctx) {
    try {
        const access = await templateAccess(request, true);
        if (!access.ok) return access.response;
        const { id } = await params;
        const { workspaceId } = access;

        const existing = await prisma.transactionTemplate.findFirst({ where: { id, workspaceId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const v = validateTemplateInput(body, { partial: true });
        if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
        const d = v.data;

        // Merge with stored values so cross-field rules use the final state.
        const merged = {
            type: d.type ?? existing.type,
            accountId: d.accountId !== undefined ? d.accountId : existing.accountId,
            categoryId: d.categoryId !== undefined ? d.categoryId : existing.categoryId,
            dateMode: d.dateMode ?? existing.dateMode,
            fixedDate: d.fixedDate !== undefined ? d.fixedDate : existing.fixedDate,
        };

        if (merged.dateMode === 'FIXED' && !merged.fixedDate) {
            return NextResponse.json({ error: 'Fixed date is required' }, { status: 400 });
        }

        if (d.name !== undefined && (await isTemplateNameTaken(workspaceId, d.name, existing.id))) {
            return NextResponse.json(
                { error: 'A template with this name already exists' },
                { status: 400 },
            );
        }

        // Unchanged references are not re-checked, so templates pointing at a since-deactivated
        // account/category stay editable. A changed reference must be active.
        if (merged.accountId && merged.accountId !== existing.accountId) {
            const err = await getAccountError(workspaceId, merged.accountId, {
                requireActive: true,
            });
            if (err) return NextResponse.json({ error: err }, { status: 400 });
        }
        if (
            merged.categoryId &&
            (merged.categoryId !== existing.categoryId || merged.type !== existing.type)
        ) {
            const err = await getCategoryError(merged.categoryId, workspaceId, {
                type: merged.type,
                requireActive: merged.categoryId !== existing.categoryId,
            });
            if (err) return NextResponse.json({ error: err }, { status: 400 });
        }

        const updated = await prisma.transactionTemplate.update({
            where: { id: existing.id },
            data: {
                ...(d.name !== undefined && { name: d.name }),
                ...(d.type !== undefined && { type: d.type }),
                ...(d.amount !== undefined && { amount: d.amount }),
                ...(d.description !== undefined && { description: d.description }),
                ...(d.accountId !== undefined && { accountId: d.accountId }),
                ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
                dateMode: merged.dateMode,
                fixedDate: merged.dateMode === 'FIXED' ? merged.fixedDate : null,
            },
            include: TEMPLATE_INCLUDE,
        });
        const changes = {
            ...(existing.name !== updated.name
                ? { name: { before: existing.name, after: updated.name } }
                : {}),
            ...(existing.type !== updated.type
                ? { type: { before: existing.type, after: updated.type } }
                : {}),
            ...(existing.amount !== updated.amount
                ? { amount: { before: existing.amount, after: updated.amount } }
                : {}),
            ...(existing.description !== updated.description
                ? { description: { before: existing.description, after: updated.description } }
                : {}),
            ...(existing.accountId !== updated.accountId
                ? { accountId: { before: existing.accountId, after: updated.accountId } }
                : {}),
            ...(existing.categoryId !== updated.categoryId
                ? { categoryId: { before: existing.categoryId, after: updated.categoryId } }
                : {}),
            ...(existing.dateMode !== updated.dateMode
                ? { dateMode: { before: existing.dateMode, after: updated.dateMode } }
                : {}),
            ...(existing.fixedDate?.getTime() !== updated.fixedDate?.getTime()
                ? { fixedDate: { before: existing.fixedDate, after: updated.fixedDate } }
                : {}),
        };
        if (Object.keys(changes).length > 0) {
            const userId = await requireUserId();
            await logAudit({
                actor: userId ? await userActor(userId) : { type: 'USER' },
                action: AUDIT_ACTIONS.TEMPLATE_UPDATED,
                resourceType: 'template',
                resourceId: updated.id,
                workspaceId,
                metadata: { targetName: updated.name, changes },
            });
        }
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'A template with this name already exists' },
                    { status: 400 },
                );
            }
            if (error.code === 'P2003') {
                return NextResponse.json({ error: 'Invalid category or account' }, { status: 400 });
            }
        }
        console.error('Failed to update template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Ctx) {
    try {
        const access = await templateAccess(request, true);
        if (!access.ok) return access.response;
        const { id } = await params;

        const existing = await prisma.transactionTemplate.findFirst({
            where: { id, workspaceId: access.workspaceId },
            select: { id: true, name: true },
        });
        const res = await prisma.transactionTemplate.deleteMany({
            where: { id, workspaceId: access.workspaceId },
        });
        if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (existing) {
            const userId = await requireUserId();
            await logAudit({
                actor: userId ? await userActor(userId) : { type: 'USER' },
                action: AUDIT_ACTIONS.TEMPLATE_DELETED,
                resourceType: 'template',
                resourceId: existing.id,
                workspaceId: access.workspaceId,
                metadata: { targetName: existing.name },
            });
        }
        return NextResponse.json({ id });
    } catch (error) {
        console.error('Failed to delete template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
