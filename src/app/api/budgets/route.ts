import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCategoryError } from '@/lib/categories';
import { budgetAccess } from '@/lib/budgets/budget-access';
import { getBudgetUsage, parsePeriod, parseStartDate, validateAmount } from '@/lib/budgets/budgets';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export async function GET(request: NextRequest) {
    const access = await budgetAccess(request, false);
    if (!access.ok) return access.response;

    const period = parsePeriod(request.nextUrl.searchParams);
    if ('error' in period) return NextResponse.json({ error: period.error }, { status: 400 });

    const { budgets, totals } = await getBudgetUsage(access.workspaceId, period.from, period.to);
    return NextResponse.json({
        period: { from: period.from.toISOString(), to: period.to.toISOString() },
        budgets,
        totals,
    });
}

export async function POST(request: NextRequest) {
    const access = await budgetAccess(request, true);
    if (!access.ok) return access.response;
    const { workspaceId } = access;

    const body = await request.json().catch(() => null);
    if (!body || typeof body.categoryId !== 'string' || !body.categoryId) {
        return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const amount = validateAmount(body.amount);
    if ('error' in amount) return NextResponse.json({ error: amount.error }, { status: 400 });

    const start = parseStartDate(body.startDate);
    if ('error' in start) return NextResponse.json({ error: start.error }, { status: 400 });

    // global OR this workspace's category, expense-capable (DEBIT/BOTH), active
    const categoryError = await getCategoryError(body.categoryId, workspaceId, {
        type: 'DEBIT',
        requireActive: true,
    });
    if (categoryError) return NextResponse.json({ error: categoryError }, { status: 400 });

    const key = { workspaceId, categoryId: body.categoryId, period: 'MONTHLY' as const };

    try {
        const existing = await prisma.budget.findFirst({ where: key });
        if (existing?.isActive) {
            return NextResponse.json(
                { error: 'A budget for this category already exists' },
                { status: 409 },
            );
        }

        const blocked = await enforceWorkspaceLimit(workspaceId, 'maxBudgets'); // adapt `workspaceId` to the variable this route uses
        if (blocked) return blocked;

        const budget = existing
            ? await prisma.budget.update({
                  where: { id: existing.id },
                  data: {
                      amount: amount.amount,
                      startDate: start.startDate,
                      endDate: null,
                      isActive: true,
                  },
              })
            : await prisma.budget.create({
                  data: { ...key, amount: amount.amount, startDate: start.startDate },
              });

        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.BUDGET_SAVED,
            resourceType: 'budget',
            resourceId: budget.id,
            workspaceId,
            metadata: {
                categoryId: body.categoryId,
                before: existing
                    ? {
                          amount: existing.amount,
                          startDate: existing.startDate,
                          endDate: existing.endDate,
                          isActive: existing.isActive,
                      }
                    : null,
                after: {
                    amount: budget.amount,
                    startDate: budget.startDate,
                    endDate: budget.endDate,
                    isActive: budget.isActive,
                },
            },
        });

        return NextResponse.json({ budget }, { status: existing ? 200 : 201 });
    } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A budget for this category already exists' },
                { status: 409 },
            );
        }
        return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
    }
}
