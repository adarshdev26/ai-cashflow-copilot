import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess, requireWorkspaceAction } from '@/lib/auth/workspaces';
import { toGoalView } from '@/features/goals/lib/goals';
import { validateGoalInput } from '@/features/goals/lib/validate-goal';
import { toScheduleDate } from '@/lib/recurring/recurring-dates';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function GET(request: Request) {
    try {
        const access = await requireWorkspaceAccess(request, 'VIEWER');
        if (!access.ok) return access.response;
        const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true';
        const goals = await prisma.goal.findMany({
            where: {
                workspaceId: access.workspaceId,
                ...(includeArchived ? {} : { status: 'ACTIVE' }),
            },
            orderBy: [{ targetDate: 'asc' }, { createdAt: 'desc' }],
        });
        return NextResponse.json({ goals: goals.map((goal) => toGoalView(goal)) });
    } catch (error) {
        console.error('Failed to fetch goals:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await requireWorkspaceAction(request, 'goals.manage');
        if (!access.ok) return access.response;
        const input = validateGoalInput(await request.json().catch(() => null));
        if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
        const goal = await prisma.goal.create({
            data: {
                ...input.value,
                targetDate: toScheduleDate(input.value.targetDate),
                workspaceId: access.workspaceId,
                currentAmount: 0,
                status: 'ACTIVE',
            },
        });
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.GOAL_CREATED,
            resourceType: 'goal',
            resourceId: goal.id,
            workspaceId: access.workspaceId,
            metadata: { name: goal.name, targetAmount: goal.targetAmount, targetDate: goal.targetDate },
        });
        return NextResponse.json({ goal: toGoalView(goal) }, { status: 201 });
    } catch (error) {
        console.error('Failed to create goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
