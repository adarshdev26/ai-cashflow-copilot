import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { toGoalView } from '@/features/goals/lib/goals';
import { validateGoalInput } from '@/features/goals/lib/validate-goal';
import { toScheduleDate } from '@/lib/recurring/recurring-dates';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
    try {
        const access = await requireWorkspaceAction(request, 'goals.manage');
        if (!access.ok) return access.response;
        const { id } = await params;
        const existing = await prisma.goal.findFirst({
            where: { id, workspaceId: access.workspaceId },
        });
        if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        if (existing.status === 'ARCHIVED')
            return NextResponse.json({ error: 'Archived goals cannot be edited' }, { status: 400 });
        const input = validateGoalInput(await request.json().catch(() => null));
        if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
        const goal = await prisma.goal.update({
            where: { id: existing.id, workspaceId: access.workspaceId },
            data: { ...input.value, targetDate: toScheduleDate(input.value.targetDate) },
        });
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.GOAL_UPDATED,
            resourceType: 'goal',
            resourceId: goal.id,
            workspaceId: access.workspaceId,
            metadata: {
                before: {
                    name: existing.name,
                    targetAmount: existing.targetAmount,
                    targetDate: existing.targetDate,
                    description: existing.description,
                },
                after: {
                    name: goal.name,
                    targetAmount: goal.targetAmount,
                    targetDate: goal.targetDate,
                    description: goal.description,
                },
            },
        });
        return NextResponse.json({ goal: toGoalView(goal) });
    } catch (error) {
        console.error('Failed to update goal:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: Context) {
    try {
        const access = await requireWorkspaceAction(request, 'goals.manage');
        if (!access.ok) return access.response;
        const { id } = await params;
        const existing = await prisma.goal.findFirst({
            where: { id, workspaceId: access.workspaceId },
        });
        if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        const goal = await prisma.goal.update({
            where: { id: existing.id, workspaceId: access.workspaceId },
            data: { status: 'ARCHIVED' },
        });
        if (existing.status !== 'ARCHIVED') {
            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.GOAL_ARCHIVED,
                resourceType: 'goal',
                resourceId: goal.id,
                workspaceId: access.workspaceId,
                metadata: { name: goal.name },
            });
        }
        return NextResponse.json({ goal: toGoalView(goal) });
    } catch (error) {
        console.error('Failed to archive goal:', error);
        return NextResponse.json({ error: 'Failed to archive goal' }, { status: 500 });
    }
}
