import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { toGoalView } from '@/features/goals/lib/goals';
import { validateGoalContribution } from '@/features/goals/lib/validate-goal';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
    try {
        const access = await requireWorkspaceAction(request, 'goals.manage');
        if (!access.ok) return access.response;
        const { id } = await params;
        const existing = await prisma.goal.findFirst({
            where: { id, workspaceId: access.workspaceId },
        });
        if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        if (existing.status === 'ARCHIVED') {
            return NextResponse.json(
                { error: 'Archived goals cannot receive contributions' },
                { status: 400 },
            );
        }
        const input = validateGoalContribution(await request.json().catch(() => null));
        if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

        const result = await prisma.$transaction(async (tx) => {
            const where = {
                id,
                workspaceId: access.workspaceId,
                status: 'ACTIVE' as const,
                ...(input.value.kind === 'REMOVE'
                    ? { currentAmount: { gte: input.value.amount } }
                    : {}),
            };
            const changed = await tx.goal.updateMany({
                where,
                data: {
                    currentAmount: {
                        [input.value.kind === 'ADD' ? 'increment' : 'decrement']:
                            input.value.amount,
                    },
                },
            });
            if (changed.count !== 1) return null;
            await tx.goalContribution.create({
                data: {
                    goalId: id,
                    kind: input.value.kind,
                    amount: input.value.amount,
                },
            });
            return tx.goal.findFirst({ where: { id, workspaceId: access.workspaceId } });
        });

        if (!result) {
            const exists = await prisma.goal.findFirst({
                where: { id, workspaceId: access.workspaceId },
            });
            if (!exists) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
            if (exists.status === 'ARCHIVED')
                return NextResponse.json(
                    { error: 'Archived goals cannot receive contributions' },
                    { status: 400 },
                );
            if (input.value.kind === 'ADD') {
                return NextResponse.json({ error: 'Goal could not be updated' }, { status: 400 });
            }
            return NextResponse.json(
                { error: 'Cannot remove more than the current amount' },
                { status: 400 },
            );
        }
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.GOAL_CONTRIBUTION_RECORDED,
            resourceType: 'goal',
            resourceId: result.id,
            workspaceId: access.workspaceId,
            metadata: {
                kind: input.value.kind,
                amount: input.value.amount,
                after: { currentAmount: result.currentAmount },
            },
        });
        return NextResponse.json({ goal: toGoalView(result) });
    } catch (error) {
        console.error('Failed to update goal contribution:', error);
        return NextResponse.json({ error: 'Failed to update goal contribution' }, { status: 500 });
    }
}
