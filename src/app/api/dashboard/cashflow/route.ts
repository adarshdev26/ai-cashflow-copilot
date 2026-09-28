import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';

const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 60; // "all" is capped at 5 years so the chart stays readable

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function parseMonths(value: string | null): number | 'all' {
  if (value === 'all') return 'all';
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_MONTHS;
  return Math.min(parsed, MAX_MONTHS);
}

export async function GET(req: Request) {
  try {
    const access = await requireWorkspaceAccess(req, 'VIEWER');
    if (!access.ok) return access.response;

    const { workspaceId } = access;
    const requested = parseMonths(new URL(req.url).searchParams.get('months'));
    const now = new Date();

    let months: number;
    if (requested === 'all') {
      // Start from the workspace's first transaction
      const first = await prisma.transaction.aggregate({
        where: { workspaceId },
        _min: { createdAt: true },
      });
      const firstDate = first._min.createdAt;
      months = firstDate
        ? Math.min(
            MAX_MONTHS,
            Math.max(1, (now.getFullYear() - firstDate.getFullYear()) * 12 + now.getMonth() - firstDate.getMonth() + 1)
          )
        : DEFAULT_MONTHS;
    } else {
      months = requested;
    }

    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const rows = await prisma.transaction.findMany({
      where: { workspaceId, createdAt: { gte: start } },
      select: { type: true, amount: true, createdAt: true },
    });

    const buckets = new Map<string, { key: string; label: string; income: number; expense: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = monthKey(d);
      buckets.set(key, {
        key,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        income: 0,
        expense: 0,
      });
    }

    for (const row of rows) {
      const bucket = buckets.get(monthKey(new Date(row.createdAt)));
      if (!bucket) continue;
      if (row.type === 'CREDIT') bucket.income += Number(row.amount);
      else bucket.expense += Number(row.amount);
    }

    return NextResponse.json(Array.from(buckets.values()), { status: 200 });
  } catch (error) {
    console.error('Cashflow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}