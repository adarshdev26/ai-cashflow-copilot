import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';

const MONTHS = 6;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);

    // Only the last 6 months, only the 3 columns we need
    const rows = await prisma.transaction.findMany({
      where: { workspace: { userId }, createdAt: { gte: start } },
      select: { type: true, amount: true, createdAt: true },
    });

    // Pre-fill every month so empty months show as zero instead of disappearing
    const buckets = new Map<string, { key: string; label: string; income: number; expense: number }>();
    for (let i = 0; i < MONTHS; i++) {
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