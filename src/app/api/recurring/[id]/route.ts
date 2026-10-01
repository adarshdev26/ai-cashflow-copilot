import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recurringAccess } from '@/lib/recurring-access';
import { firstOccurrenceOnOrAfter, toScheduleDate } from '@/lib/recurring-dates';
import { validateRecurringInput, checkTargets } from '@/features/recurring/lib/validate-recurring';

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
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

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
    return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 });
  }

  const targetsChanged =
    merged.accountId !== existing.accountId ||
    merged.categoryId !== existing.categoryId ||
    merged.type !== existing.type;
  const resuming = !existing.isActive && merged.isActive;
  if (targetsChanged || resuming) {
    const err = await checkTargets(access.workspaceId, merged.accountId, merged.categoryId, merged.type);
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
    return NextResponse.json({ error: 'Schedule has ended. Extend the end date first.' }, { status: 400 });
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
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const access = await recurringAccess(request, true);
  if (!access.ok) return access.response;
  const { id } = await params;

  const res = await prisma.recurringTransaction.deleteMany({
    where: { id, workspaceId: access.workspaceId },
  });
  if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}