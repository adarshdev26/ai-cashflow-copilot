import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { prisma } from '@/lib/prisma';

type CategoryTotals = {
  categoryId: string;
  name: string;
  color: string | null;
  income: number;
  expense: number;
  net: number;
  count: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// undefined = not provided, null = provided but invalid
function parseDate(value: string | null): Date | undefined | null {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAccess(req, 'VIEWER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;

    // Optional range — omit both to get all-time totals per category.
    const { searchParams } = new URL(req.url);
    const gte = parseDate(searchParams.get('gte'));
    const lt = parseDate(searchParams.get('lt'));

    if (gte === null || lt === null) {
      return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
    }

    const dateFilter =
      gte || lt
        ? { createdAt: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } }
        : {};

    const [categories, rows] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, color: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where: { workspaceId, ...dateFilter },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const totals = new Map<string, CategoryTotals>();

    // Seed every known category so ones with zero activity in range can be
    // included/filtered deliberately rather than silently missing.
    for (const category of categories) {
      totals.set(category.id, {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      });
    }

    for (const row of rows) {
      if (!row.categoryId) continue;

      let entry = totals.get(row.categoryId);
      if (!entry) {
        // Category was deleted after transactions referencing it were made.
        entry = {
          categoryId: row.categoryId,
          name: 'Uncategorized',
          color: null,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        };
        totals.set(row.categoryId, entry);
      }

      const sum = row._sum.amount ?? 0;
      entry.count += row._count._all;
      if (row.type === 'CREDIT') entry.income += sum;
      else entry.expense += sum;
    }

    const result = Array.from(totals.values())
      .filter((c) => c.count > 0)
      .map((c) => ({
        ...c,
        income: round2(c.income),
        expense: round2(c.expense),
        net: round2(c.income - c.expense),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch category summary:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}