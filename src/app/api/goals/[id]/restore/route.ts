import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { toGoalView } from '@/features/goals/lib/goals';
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
        if (existing.status !== 'ARCHIVED') {
            return NextResponse.json({ error: 'Goal is not archived' }, { status: 400 });
        }

        const goal = await prisma.goal.update({
            where: { id: existing.id, workspaceId: access.workspaceId },
            data: { status: 'ACTIVE' },
        });
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.GOAL_RESTORED,
            resourceType: 'goal',
            resourceId: goal.id,
            workspaceId: access.workspaceId,
            metadata: { name: goal.name },
        });
        return NextResponse.json({ goal: toGoalView(goal) });
    } catch (error) {
        console.error('Failed to restore goal:', error);
        return NextResponse.json({ error: 'Failed to restore goal' }, { status: 500 });
    }
}
