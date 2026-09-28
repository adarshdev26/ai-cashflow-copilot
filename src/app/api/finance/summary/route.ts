import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { prisma } from '@/lib/prisma';

type Totals = { income: number; expense: number; net: number; count: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

// undefined = not provided, null = provided but invalid
function parseDate(value: string | null): Date | undefined | null {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function totalsFor(workspaceId: string, range?: { gte: Date; lt: Date }): Promise<Totals> {
  const rows = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      workspaceId,
      ...(range ? { createdAt: range } : {}),
    },
    _sum: { amount: true },
    _count: { _all: true },
  });

  let income = 0;
  let expense = 0;
  let count = 0;

  for (const row of rows) {
    const sum = row._sum.amount ?? 0;
    count += row._count._all;
    if (row.type === 'CREDIT') income += sum;
    else expense += sum;
  }

  return { income: round2(income), expense: round2(expense), net: round2(income - expense), count };
}

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAccess(req, 'VIEWER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;

    // Month boundaries are sent by the browser so "this month" follows the
    // user's timezone. Falls back to server time when they are not provided.
    const { searchParams } = new URL(req.url);
    const lastMonthStartParam = parseDate(searchParams.get('lastMonthStart'));
    const thisMonthStartParam = parseDate(searchParams.get('thisMonthStart'));
    const nextMonthStartParam = parseDate(searchParams.get('nextMonthStart'));

    if (lastMonthStartParam === null || thisMonthStartParam === null || nextMonthStartParam === null) {
      return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
    }

    const now = new Date();
    const lastMonthStart = lastMonthStartParam ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = thisMonthStartParam ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = nextMonthStartParam ?? new Date(now.getFullYear(), now.getMonth() + 1, 1);

    if (!(lastMonthStart < thisMonthStart && thisMonthStart < nextMonthStart)) {
      return NextResponse.json({ error: 'Invalid month range' }, { status: 400 });
    }

    const [allTime, thisMonth, lastMonth] = await Promise.all([
      totalsFor(workspaceId),
      totalsFor(workspaceId, { gte: thisMonthStart, lt: nextMonthStart }),
      totalsFor(workspaceId, { gte: lastMonthStart, lt: thisMonthStart }),
    ]);

    return NextResponse.json({ allTime, thisMonth, lastMonth }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch transaction summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}