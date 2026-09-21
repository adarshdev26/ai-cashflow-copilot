import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateTransactionData } from '@/features/finance/lib/validate-transaction';

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        workspace: {
          userId,
        },
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    let validatedData;
    try {
      validatedData = validateTransactionData(body);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const { amount, type, description, categoryId } = validatedData;

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Find the user's workspace, or create a default one if none exists
    let workspace = await prisma.workspace.findFirst({
      where: { userId },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Personal Workspace',
          userId,
        },
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        workspaceId: workspace.id,
        categoryId,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}