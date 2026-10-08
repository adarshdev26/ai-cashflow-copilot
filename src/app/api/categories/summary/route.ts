import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { getCategoryTotals } from '@/lib/finance/totals';

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

        const result = await getCategoryTotals(workspaceId, { gte, lt });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch category summary:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
