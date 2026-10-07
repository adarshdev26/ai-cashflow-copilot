import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { getSystemNumber } from '@/lib/settings/server';
import { FINANCIAL_TYPES } from '@/lib/transaction-filters';

const DEFAULT_DAYS = 30;

const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function parseDays(value: string | null, maxDays: number): number | 'all' {
    if (value === 'all') return 'all';
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_DAYS;
    return Math.min(parsed, maxDays);
}

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const maxDays = await getSystemNumber('limits.balanceTrendMaxDays');
        const requested = parseDays(new URL(req.url).searchParams.get('days'), maxDays);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let days: number;
        if (requested === 'all') {
            const first = await prisma.transaction.aggregate({
                where: { workspaceId, type: { in: FINANCIAL_TYPES } },
                _min: { createdAt: true },
            });
            const firstDate = first._min.createdAt;
            if (firstDate) {
                const firstDay = new Date(
                    firstDate.getFullYear(),
                    firstDate.getMonth(),
                    firstDate.getDate(),
                );
                const diff = Math.round((today.getTime() - firstDay.getTime()) / 86_400_000) + 1;
                days = Math.min(maxDays, Math.max(1, diff));
            } else {
                days = DEFAULT_DAYS;
            }
        } else {
            days = requested;
        }

        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));

        const [before, rows] = await Promise.all([
            // Opening balance: everything before the window, summed by the database
            prisma.transaction.groupBy({
                by: ['type'],
                where: { workspaceId, type: { in: FINANCIAL_TYPES }, createdAt: { lt: start } },
                _sum: { amount: true },
            }),
            prisma.transaction.findMany({
                where: { workspaceId, type: { in: FINANCIAL_TYPES }, createdAt: { gte: start } },
                select: { type: true, amount: true, createdAt: true },
            }),
        ]);

        const credit = Number(before.find((t) => t.type === 'CREDIT')?._sum.amount ?? 0);
        const debit = Number(before.find((t) => t.type === 'DEBIT')?._sum.amount ?? 0);
        let running = credit - debit;

        const netByDay = new Map<string, number>();
        for (const row of rows) {
            const key = dayKey(new Date(row.createdAt));
            const amount = Number(row.amount);
            netByDay.set(
                key,
                (netByDay.get(key) ?? 0) + (row.type === 'CREDIT' ? amount : -amount),
            );
        }

        const points = Array.from({ length: days }, (_, i) => {
            const date = dayKey(
                new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
            );
            running += netByDay.get(date) ?? 0;
            return { date, balance: running };
        });

        return NextResponse.json(points, { status: 200 });
    } catch (error) {
        console.error('Balance trend error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
