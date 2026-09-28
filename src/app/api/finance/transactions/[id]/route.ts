import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { validateTransactionData } from '@/features/finance/lib/validate-transaction';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireWorkspaceAccess(req, 'MEMBER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;
    const { id } = await params;

    // Verify the transaction belongs to this workspace (returns 404 if not)
    const existing = await prisma.transaction.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await req.json();

    // Merge existing with body for validation
    const mergedData = {
      amount: body.amount !== undefined ? body.amount : existing.amount,
      type: body.type !== undefined ? body.type : existing.type,
      description: body.description !== undefined ? body.description : existing.description,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    };

    let validatedData;
    try {
      validatedData = validateTransactionData(mergedData);
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid data' }, { status: 400 });
    }

    const { amount, type, description, categoryId } = validatedData;

    if (categoryId && categoryId !== existing.categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        type,
        description,
        categoryId: body.categoryId === null ? null : categoryId,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireWorkspaceAccess(req, 'MEMBER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;
    const { id } = await params;

    // Verify the transaction belongs to this workspace (returns 404 if not)
    const existing = await prisma.transaction.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
