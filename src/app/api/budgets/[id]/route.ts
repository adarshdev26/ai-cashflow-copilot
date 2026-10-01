import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { budgetAccess } from '@/lib/budget-access';
import { validateAmount } from '@/lib/budgets';

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

  await prisma.budget.update({ where: { id: existing.id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}