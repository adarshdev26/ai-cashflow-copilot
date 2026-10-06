import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { recurringAccess } from '@/lib/recurring/recurring-access';
import { firstOccurrenceOnOrAfter, toScheduleDate } from '@/lib/recurring/recurring-dates';
import { validateRecurringInput, checkTargets } from '@/features/recurring/lib/validate-recurring';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
const INCLUDE = { account: { select: { id: true, name: true } } } as const;

export async function PATCH(request: Request, { params }: Ctx) {
    const access = await recurringAccess(request, true);
    if (!access.ok) return access.response;
    const { id } = await params;

    const existing = await prisma.recurringTransaction.findFirst({
        where: { id, workspaceId: access.workspaceId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const v = validateRecurringInput(body, { partial: true });
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const d = v.data;

    // Merge with stored values so cross-field rules use the final state.
    const merged = {
        accountId: d.accountId ?? existing.accountId,
        categoryId: d.categoryId !== undefined ? d.categoryId : existing.categoryId,
        type: d.type ?? existing.type,
        frequency: d.frequency ?? existing.frequency,
        startDate: d.startDate ?? existing.startDate,
        endDate: d.endDate !== undefined ? d.endDate : existing.endDate,
        isActive: d.isActive ?? existing.isActive,
    };
    if (merged.endDate && merged.endDate < merged.startDate) {
        return NextResponse.json(
            { error: 'End date must be on or after start date' },
            { status: 400 },
        );
    }

    const targetsChanged =
        merged.accountId !== existing.accountId ||
        merged.categoryId !== existing.categoryId ||
        merged.type !== existing.type;
    const resuming = !existing.isActive && merged.isActive;
    if (targetsChanged || resuming) {
        const err = await checkTargets(
            access.workspaceId,
            merged.accountId,
            merged.categoryId,
            merged.type,
        );
        if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const today = toScheduleDate(new Date());
    const scheduleChanged =
        +merged.startDate !== +existing.startDate || merged.frequency !== existing.frequency;
    let nextRunAt = existing.nextRunAt;
    let clearError = false;

    if (scheduleChanged || (resuming && existing.nextRunAt < today)) {
        nextRunAt = firstOccurrenceOnOrAfter(merged.startDate, merged.frequency, today);
        clearError = true;
    }
    if (resuming) clearError = true;

    if (merged.isActive && merged.endDate && nextRunAt > merged.endDate) {
        return NextResponse.json(
            { error: 'Schedule has ended. Extend the end date first.' },
            { status: 400 },
        );
    }

    const updated = await prisma.recurringTransaction.update({
        where: { id: existing.id },
        data: {
            ...(d.accountId !== undefined && { accountId: d.accountId }),
            ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
            ...(d.description !== undefined && { description: d.description }),
            ...(d.amount !== undefined && { amount: d.amount }),
            ...(d.type !== undefined && { type: d.type }),
            ...(d.frequency !== undefined && { frequency: d.frequency }),
            ...(d.startDate !== undefined && { startDate: d.startDate }),
            ...(d.endDate !== undefined && { endDate: d.endDate }),
            isActive: merged.isActive,
            nextRunAt,
            ...(clearError && { lastError: null }),
        },
        include: INCLUDE,
    });
    const changes = {
        ...(existing.accountId !== updated.accountId
            ? { accountId: { before: existing.accountId, after: updated.accountId } }
            : {}),
        ...(existing.categoryId !== updated.categoryId
            ? { categoryId: { before: existing.categoryId, after: updated.categoryId } }
            : {}),
        ...(existing.description !== updated.description
            ? { description: { before: existing.description, after: updated.description } }
            : {}),
        ...(existing.amount !== updated.amount
            ? { amount: { before: existing.amount, after: updated.amount } }
            : {}),
        ...(existing.type !== updated.type
            ? { type: { before: existing.type, after: updated.type } }
            : {}),
        ...(existing.frequency !== updated.frequency
            ? { frequency: { before: existing.frequency, after: updated.frequency } }
            : {}),
        ...(existing.startDate.getTime() !== updated.startDate.getTime()
            ? { startDate: { before: existing.startDate, after: updated.startDate } }
            : {}),
        ...(existing.endDate?.getTime() !== updated.endDate?.getTime()
            ? { endDate: { before: existing.endDate, after: updated.endDate } }
            : {}),
        ...(existing.isActive !== updated.isActive
            ? { isActive: { before: existing.isActive, after: updated.isActive } }
            : {}),
    };
    if (Object.keys(changes).length > 0) {
        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.RECURRING_UPDATED,
            resourceType: 'recurring',
            resourceId: updated.id,
            workspaceId: access.workspaceId,
            metadata: { targetName: updated.description, changes },
        });
    }
    return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Ctx) {
    const access = await recurringAccess(request, true);
    if (!access.ok) return access.response;
    const { id } = await params;

    const existing = await prisma.recurringTransaction.findFirst({
        where: { id, workspaceId: access.workspaceId },
        select: { id: true, description: true, amount: true, type: true },
    });
    const res = await prisma.recurringTransaction.deleteMany({
        where: { id, workspaceId: access.workspaceId },
    });
    if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing) {
        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.RECURRING_DELETED,
            resourceType: 'recurring',
            resourceId: existing.id,
            workspaceId: access.workspaceId,
            metadata: {
                targetName: existing.description,
                amount: existing.amount,
                type: existing.type,
            },
        });
    }
    return NextResponse.json({ ok: true });
}
