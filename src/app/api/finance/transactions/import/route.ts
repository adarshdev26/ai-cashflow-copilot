import { parseTransactionCsv, type CsvRowError } from '@/features/finance/lib/transaction-csv';
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/db/prisma";
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { visibleCategoryWhere } from '@/lib/categories';
import { getSystemBool, getSystemNumber } from '@/lib/settings/server';

export async function POST(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'MEMBER'); // same level as creating a transaction
        if (!access.ok) return access.response;
        if (!(await getSystemBool('features.csvImportEnabled'))) {
            return NextResponse.json({ error: 'CSV import is currently disabled' }, { status: 403 });
        }
        const [maxBytes, maxRows] = await Promise.all([
            getSystemNumber('limits.csvImportMaxBytes'),
            getSystemNumber('limits.csvImportMaxRows'),
        ]);
        const { workspaceId } = access;

        const body = await req.json().catch(() => null);
        const csv = typeof body?.csv === 'string' ? body.csv : null;
        const defaultAccountId = typeof body?.defaultAccountId === 'string' ? body.defaultAccountId : null;
        const dryRun = body?.dryRun === true;

        if (!csv) return NextResponse.json({ error: 'csv is required' }, { status: 400 });
        if (new TextEncoder().encode(csv).byteLength > maxBytes) return NextResponse.json({ error: 'File is too large' }, { status: 413 });

        const { rows, errors: parseErrors } = parseTransactionCsv(csv, maxRows);
        const errors: CsvRowError[] = [...parseErrors];
        if (errors.length) return NextResponse.json({ ok: false, errors: errors.slice(0, 100) });
        if (!rows.length) return NextResponse.json({ ok: false, errors: [{ row: 1, message: 'No data rows found' }] });

        const [accounts, categories] = await Promise.all([
            prisma.financialAccount.findMany({ where: { workspaceId }, select: { id: true, name: true, isActive: true } }),
            prisma.category.findMany({
                where: visibleCategoryWhere(workspaceId),
                select: { id: true, name: true, type: true, isActive: true },
            }),
        ]);

        // lookup by id and by lowercase name; a name used twice is ambiguous
        const accountById = new Map(accounts.map((a) => [a.id, a]));
        const accountByName = new Map<string, (typeof accounts)[number] | 'AMBIGUOUS'>();
        for (const a of accounts) {
            const k = a.name.toLowerCase();
            accountByName.set(k, accountByName.has(k) ? 'AMBIGUOUS' : a);
        }
        const categoryByName = new Map<string, (typeof categories)[number] | 'AMBIGUOUS'>();
        for (const c of categories) {
            const k = c.name.toLowerCase();
            categoryByName.set(k, categoryByName.has(k) ? 'AMBIGUOUS' : c);
        }

        const fallback = defaultAccountId ? accountById.get(defaultAccountId) : undefined;
        const data: {
            workspaceId: string; accountId: string; categoryId: string | null;
            type: 'CREDIT' | 'DEBIT'; amount: number; description: string | null; createdAt: Date;
        }[] = [];

        for (const r of rows) {
            let account;
            if (r.account) {
                account = accountById.get(r.account) ?? accountByName.get(r.account.toLowerCase());
                if (!account) { errors.push({ row: r.row, message: `Financial Account "${r.account}" not found in this workspace` }); continue; }
                if (account === 'AMBIGUOUS') { errors.push({ row: r.row, message: `Financial Account "${r.account}" matches more than one account, use its id` }); continue; }
            } else {
                account = fallback;
                if (!account) { errors.push({ row: r.row, message: 'No Financial Account value and no account is selected' }); continue; }
            }
            if (!account.isActive) { errors.push({ row: r.row, message: `Account "${account.name}" is inactive` }); continue; }

            let categoryId: string | null = null;
            if (r.category) {
                const c = categoryByName.get(r.category.toLowerCase());
                if (!c) { errors.push({ row: r.row, message: `Category "${r.category}" does not exist` }); continue; }
                if (c === 'AMBIGUOUS') { errors.push({ row: r.row, message: `Category "${r.category}" is ambiguous` }); continue; }
                if (!c.isActive) { errors.push({ row: r.row, message: `Category "${c.name}" is inactive` }); continue; }
                if (c.type !== 'BOTH' && c.type !== r.type) {
                    errors.push({
                        row: r.row,
                        message: `Category "${c.name}" is only for ${c.type === 'CREDIT' ? 'income' : 'expense'} transactions`,
                    });
                    continue;
                }
                categoryId = c.id;
            }

            data.push({
                workspaceId, accountId: account.id, categoryId,
                type: r.type, amount: r.amount, description: r.description, createdAt: new Date(r.date),
            });
        }

        if (errors.length) return NextResponse.json({ ok: false, errors: errors.slice(0, 100), errorCount: errors.length });
        if (dryRun) return NextResponse.json({ ok: true, dryRun: true, total: data.length });

        const result = await prisma.transaction.createMany({ data });
        return NextResponse.json({ ok: true, dryRun: false, imported: result.count });
    } catch (error) {
        console.error('Failed to import transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
