import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/auth';

const DAYS = 30;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS - 1));

    const [before, rows] = await Promise.all([
      // Opening balance: everything before the window, summed by the database
      prisma.transaction.groupBy({
        by: ['type'],
        where: { workspace: { userId }, createdAt: { lt: start } },
        _sum: { amount: true },
      }),
      // Only the window's rows
      prisma.transaction.findMany({
        where: { workspace: { userId }, createdAt: { gte: start } },
        select: { type: true, amount: true, createdAt: true },
      }),
    ]);

    const credit = Number(before.find((t) => t.type === 'CREDIT')?._sum.amount ?? 0);
    const debit = Number(before.find((t) => t.type === 'DEBIT')?._sum.amount ?? 0);
    let running = credit - debit;

    // Net change per day
    const netByDay = new Map<string, number>();
    for (const row of rows) {
      const key = dayKey(new Date(row.createdAt));
      const amount = Number(row.amount);
      netByDay.set(key, (netByDay.get(key) ?? 0) + (row.type === 'CREDIT' ? amount : -amount));
    }

    const points = Array.from({ length: DAYS }, (_, i) => {
      const date = dayKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
      running += netByDay.get(date) ?? 0;
      return { date, balance: running };
    });

    return NextResponse.json(points, { status: 200 });
  } catch (error) {
    console.error('Balance trend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}