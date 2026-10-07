import Papa from 'papaparse';
import { CSV_COLUMNS } from '@/features/finance/lib/transaction-csv';
import { buildTransactionWhere, parseDateParam } from '@/lib/transaction-filters';
import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { prisma } from '@/lib/db/prisma';
import { getSystemBool, getSystemNumber } from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceFeature } from '@/lib/plans/server';

// Stops Excel from running cells that start with = + - @
const safe = (v: string | null | undefined) => (v && /^[=+\-@]/.test(v) ? `'${v}` : (v ?? ''));

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const blocked = await enforceWorkspaceFeature(access.workspaceId, 'export');
        if (blocked) return blocked;

        if (!(await getSystemBool('features.csvExportEnabled'))) {
            return NextResponse.json(
                { error: 'CSV export is currently disabled' },
                { status: 403 },
            );
        }
        const maxExportRows = await getSystemNumber('limits.csvExportMaxRows');
        const { workspaceId } = access;

        const sp = new URL(req.url).searchParams;
        const type = sp.get('type');
        const dateFrom = parseDateParam(sp.get('dateFrom'));
        const dateTo = parseDateParam(sp.get('dateTo'), true);

        if (type !== null && type !== '' && type !== 'CREDIT' && type !== 'DEBIT' && type !== 'TRANSFER') {
            return NextResponse.json({ error: 'Invalid type value' }, { status: 400 });
        }
        if (dateFrom === null || dateTo === null) {
            return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
        }
        if (dateFrom && dateTo && dateFrom > dateTo) {
            return NextResponse.json({ error: 'dateFrom must be before dateTo' }, { status: 400 });
        }

        const where = buildTransactionWhere({
            workspaceId,
            type: (type || null) as 'CREDIT' | 'DEBIT' | 'TRANSFER' | null,
            categoryId: sp.get('categoryId') || undefined,
            accountId: sp.get('accountId') || undefined,
            search: sp.get('search')?.trim() || undefined,
            dateFrom,
            dateTo,
        });

        const rows = await prisma.transaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: maxExportRows + 1,
            include: {
                category: { select: { name: true } },
                account: { select: { name: true } },
                toAccount: { select: { name: true } },
            },
        });
        if (rows.length > maxExportRows) {
            return NextResponse.json(
                { error: 'Too many rows, narrow your filters' },
                { status: 413 },
            );
        }

        const csv = Papa.unparse({
            fields: [...CSV_COLUMNS],
            data: rows.map((t) => [
                t.createdAt.toISOString(),
                t.type,
                t.amount.toFixed(2),
                safe(t.description),
                safe(t.category?.name),
                safe(t.account?.name),
                safe(t.toAccount?.name),
            ]),
        });

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.TRANSACTIONS_EXPORTED,
            resourceType: 'transaction',
            workspaceId,
            metadata: { exportType: 'transactions_csv', exportedCount: rows.length },
        });

        const stamp = new Date().toISOString().slice(0, 10);
        return new Response('\uFEFF' + csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="transactions-${stamp}.csv"`,
            },
        });
    } catch (error) {
        console.error('Failed to export transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
