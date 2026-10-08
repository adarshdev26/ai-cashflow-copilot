import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { prisma } from '@/lib/db/prisma';
import { getPeriodTotals } from '@/lib/finance/totals';

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

        // Month boundaries are sent by the browser so "this month" follows the
        // user's timezone. Falls back to server time when they are not provided.
        const { searchParams } = new URL(req.url);
        const lastMonthStartParam = parseDate(searchParams.get('lastMonthStart'));
        const thisMonthStartParam = parseDate(searchParams.get('thisMonthStart'));
        const nextMonthStartParam = parseDate(searchParams.get('nextMonthStart'));

        if (
            lastMonthStartParam === null ||
            thisMonthStartParam === null ||
            nextMonthStartParam === null
        ) {
            return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
        }

        const now = new Date();
        const lastMonthStart =
            lastMonthStartParam ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart =
            thisMonthStartParam ?? new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart =
            nextMonthStartParam ?? new Date(now.getFullYear(), now.getMonth() + 1, 1);

        if (!(lastMonthStart < thisMonthStart && thisMonthStart < nextMonthStart)) {
            return NextResponse.json({ error: 'Invalid month range' }, { status: 400 });
        }

        // Optional account filter. The account must belong to THIS workspace, so a
        // user can't probe account ids from other workspaces. Inactive accounts are
        // allowed: their history should still be viewable.
        const accountIdParam = searchParams.get('accountId')?.trim() || null;
        let accountId: string | null = null;
        if (accountIdParam) {
            const account = await prisma.financialAccount.findFirst({
                where: { id: accountIdParam, workspaceId },
                select: { id: true },
            });
            if (!account) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            accountId = account.id;
        }

        const [allTime, thisMonth, lastMonth] = await Promise.all([
            getPeriodTotals(workspaceId, accountId),
            getPeriodTotals(workspaceId, accountId, { gte: thisMonthStart, lt: nextMonthStart }),
            getPeriodTotals(workspaceId, accountId, { gte: lastMonthStart, lt: thisMonthStart }),
        ]);

        return NextResponse.json({ allTime, thisMonth, lastMonth }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch transaction summary:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
