import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateTransactionData } from '@/features/finance/lib/validate-transaction';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        workspace: { userId }
      }
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
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
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
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        workspace: { userId }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id }
    });

    return NextResponse.json({ id }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
