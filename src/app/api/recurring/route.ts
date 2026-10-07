import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { recurringAccess } from '@/lib/recurring/recurring-access';
import { firstOccurrenceOnOrAfter, toScheduleDate } from '@/lib/recurring/recurring-dates';
import { validateRecurringInput, checkTargets } from '@/features/recurring/lib/validate-recurring';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const access = await recurringAccess(request, false);
    if (!access.ok) return access.response;

    const rows = await prisma.recurringTransaction.findMany({
        where: { workspaceId: access.workspaceId },
        include: { account: { select: { id: true, name: true } } },
        orderBy: { nextRunAt: 'asc' },
    });
    return NextResponse.json(rows);
}

export async function POST(request: Request) {
    const access = await recurringAccess(request, true);
    if (!access.ok) return access.response;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const v = validateRecurringInput(body, { partial: false });
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const d = v.data;

    const targetErr = await checkTargets(
        access.workspaceId,
        d.accountId!,
        d.categoryId ?? null,
        d.type!,
    );
    if (targetErr) return NextResponse.json({ error: targetErr }, { status: 400 });

    const nextRunAt = firstOccurrenceOnOrAfter(
        d.startDate!,
        d.frequency!,
        toScheduleDate(new Date()),
    );
    if (d.endDate && nextRunAt > d.endDate) {
        return NextResponse.json(
            { error: 'Schedule would never run before its end date' },
            { status: 400 },
        );
    }

    const blocked = await enforceWorkspaceLimit(access.workspaceId, 'maxRecurring');
    if (blocked) return blocked;

    const created = await prisma.recurringTransaction.create({
        data: {
            workspaceId: access.workspaceId,
            accountId: d.accountId!,
            categoryId: d.categoryId ?? null,
            description: d.description ?? null,
            amount: d.amount!,
            type: d.type!,
            frequency: d.frequency!,
            startDate: d.startDate!,
            endDate: d.endDate ?? null,
            nextRunAt,
        },
        include: { account: { select: { id: true, name: true } } },
    });
    const userId = await requireUserId();
    await logAudit({
        actor: userId ? await userActor(userId) : { type: 'USER' },
        action: AUDIT_ACTIONS.RECURRING_CREATED,
        resourceType: 'recurring',
        resourceId: created.id,
        workspaceId: access.workspaceId,
        metadata: { targetName: created.description, amount: created.amount, type: created.type },
    });
    return NextResponse.json(created, { status: 201 });
}
