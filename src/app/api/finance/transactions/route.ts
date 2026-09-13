import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to get userId from the JWT cookie
async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        workspace: {
          userId,
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
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, type, description } = body;

    if (!amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        amount: parseFloat(amount),
        type,
        description,
        workspaceId: workspace.id, // Securely mapped using the user's real workspace ID
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}