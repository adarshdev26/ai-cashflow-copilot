import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { getSystemNumber, getUserPreferences } from '@/lib/settings/server';

const DEFAULT_MONTHS = 6;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function parseMonths(value: string | null, maxMonths: number): number | 'all' {
    if (value === 'all') return 'all';
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_MONTHS;
    return Math.min(parsed, maxMonths);
}

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const [maxMonths, preferences] = await Promise.all([
            getSystemNumber('limits.cashflowMaxMonths'),
            getUserPreferences(access.userId),
        ]);
        const locale = String(preferences.locale ?? 'en-IN');
        const requested = parseMonths(new URL(req.url).searchParams.get('months'), maxMonths);
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
                      maxMonths,
                      Math.max(
                          1,
                          (now.getFullYear() - firstDate.getFullYear()) * 12 +
                              now.getMonth() -
                              firstDate.getMonth() +
                              1,
                      ),
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

        const buckets = new Map<
            string,
            { key: string; label: string; income: number; expense: number }
        >();
        for (let i = 0; i < months; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const key = monthKey(d);
            buckets.set(key, {
                key,
                label: d.toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
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
