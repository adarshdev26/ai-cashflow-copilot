import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { budgetAccess } from '@/lib/budgets/budget-access';
import { validateAmount } from '@/lib/budgets/budgets';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
    const access = await budgetAccess(request, true);
    if (!access.ok) return access.response;
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const amount = validateAmount(body?.amount);
    if ('error' in amount) return NextResponse.json({ error: amount.error }, { status: 400 });

    // workspace-scoped lookup: another workspace's id is simply "not found"
    const existing = await prisma.budget.findFirst({
        where: { id, workspaceId: access.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    const budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: amount.amount },
    });
    if (existing.amount !== budget.amount) {
        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.BUDGET_UPDATED,
            resourceType: 'budget',
            resourceId: budget.id,
            workspaceId: access.workspaceId,
            metadata: { before: { amount: existing.amount }, after: { amount: budget.amount } },
        });
    }
    return NextResponse.json({ budget });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
    const access = await budgetAccess(request, true);
    if (!access.ok) return access.response;
    const { id } = await params;

    const existing = await prisma.budget.findFirst({
        where: { id, workspaceId: access.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    const budget = await prisma.budget.update({
        where: { id: existing.id },
        data: { isActive: false },
    });
    if (existing.isActive !== budget.isActive) {
        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.BUDGET_DEACTIVATED,
            resourceType: 'budget',
            resourceId: budget.id,
            workspaceId: access.workspaceId,
            metadata: {
                before: { isActive: existing.isActive },
                after: { isActive: budget.isActive },
            },
        });
    }
    return NextResponse.json({ success: true });
}
