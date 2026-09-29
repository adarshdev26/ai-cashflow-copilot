import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAction } from '@/lib/workspaces';
import { Prisma } from '@/generated/prisma';
import { validateCreateAccount } from '@/features/accounts/lib/validate-account';
import { getAccountTotals, toAccountWithBalance } from '@/features/accounts/lib/balance';

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAction(req, 'workspace.read');
    if (!access.ok) return access.response;

    const { workspaceId } = access;
    const onlyActive = new URL(req.url).searchParams.get('active') === 'true';

    const accounts = await prisma.financialAccount.findMany({
      where: { workspaceId, ...(onlyActive ? { isActive: true } : {}) },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });

    const totals = await getAccountTotals(workspaceId, accounts.map((a) => a.id));
    return NextResponse.json({ data: accounts.map((a) => toAccountWithBalance(a, totals)) }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireWorkspaceAction(req, 'account.create');
    if (!access.ok) return access.response;

    const { workspaceId } = access;
    const body = await req.json().catch(() => null);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { currency: true },
    });
    if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let data;
    try {
      data = validateCreateAccount(body, workspace.currency);
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid account data' }, { status: 400 });
    }

    const duplicate = await prisma.financialAccount.findFirst({
      where: { workspaceId, name: { equals: data.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'An account with this name already exists' }, { status: 409 });
    }

    const created = await prisma.financialAccount.create({
      data: { ...data, workspaceId },
      include: { _count: { select: { transactions: true } } },
    });

    return NextResponse.json(toAccountWithBalance(created, new Map()), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An account with this name already exists' }, { status: 409 });
    }
    console.error('Failed to create account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}