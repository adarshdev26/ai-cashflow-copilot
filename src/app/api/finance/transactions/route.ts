import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import {
    validateTransactionData,
} from '@/features/finance/lib/validate-transaction';
import { validateTransfer } from '@/features/finance/lib/validate-transfer';
import { getAccountError } from '@/features/accounts/lib/check-account';
import { Prisma } from '@/generated/prisma';
import { buildTransactionWhere } from '@/lib/transaction-filters';
import { getCategoryError } from '@/lib/categories';
import { getSystemNumber } from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

// Offset pagination matches the existing numbered table controls and keeps this query compatible with useQuery.
const SORT_FIELDS = ['createdAt', 'amount', 'description', 'type', 'account', 'category'] as const;
const DEFAULT_LIMIT = 10;

const TRANSACTION_INCLUDE = {
    category: { select: { id: true, name: true, color: true } },
    account: { select: { id: true, name: true, type: true, isActive: true } },
    toAccount: { select: { id: true, name: true } },
} as const;

function parseDate(value: string | null, endOfDay = false) {
    if (!value) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        date.setUTCHours(23, 59, 59, 999);
    }
    return date;
}

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const { searchParams } = new URL(req.url);
        const rawPage = Number(searchParams.get('page') ?? 1);
        const rawLimit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
        const sortBy = searchParams.get('sortBy') ?? 'createdAt';
        const sortDir = searchParams.get('sortDir') ?? 'desc';
        const type = searchParams.get('type');
        const categoryId = searchParams.get('categoryId') || undefined;
        const accountId = searchParams.get('accountId') || undefined;
        const search = searchParams.get('search')?.trim() || undefined;
        const dateFrom = parseDate(searchParams.get('dateFrom'));
        const dateTo = parseDate(searchParams.get('dateTo'), true);

        if (!Number.isInteger(rawPage) || rawPage < 1) {
            return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 });
        }
        if (!Number.isInteger(rawLimit) || rawLimit < 1) {
            return NextResponse.json(
                { error: 'limit must be a positive integer' },
                { status: 400 },
            );
        }
        if (!SORT_FIELDS.includes(sortBy as (typeof SORT_FIELDS)[number])) {
            return NextResponse.json({ error: 'Invalid sortBy value' }, { status: 400 });
        }
        if (sortDir !== 'asc' && sortDir !== 'desc') {
            return NextResponse.json({ error: 'Invalid sortDir value' }, { status: 400 });
        }
        if (type !== null && type !== 'CREDIT' && type !== 'DEBIT' && type !== 'TRANSFER') {
            return NextResponse.json({ error: 'Invalid type value' }, { status: 400 });
        }
        if (dateFrom === null || dateTo === null) {
            return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
        }
        if (dateFrom && dateTo && dateFrom > dateTo) {
            return NextResponse.json({ error: 'dateFrom must be before dateTo' }, { status: 400 });
        }

        const maxLimit = await getSystemNumber('limits.listMaxPageSize');
        const limit = Math.min(rawLimit, maxLimit);
        // workspaceId is always in the filter, so an accountId from another
        // workspace simply matches nothing.
        const where = buildTransactionWhere({
            workspaceId,
            type: type as 'CREDIT' | 'DEBIT' | 'TRANSFER' | null,
            categoryId,
            accountId,
            search,
            dateFrom,
            dateTo,
        });
        const orderBy: Prisma.TransactionOrderByWithRelationInput[] = [
            sortBy === 'account'
                ? { account: { name: sortDir } }
                : sortBy === 'category'
                    ? { category: { name: sortDir } }
                    : { [sortBy]: sortDir },
            { id: 'asc' },
        ];
        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: TRANSACTION_INCLUDE,
                orderBy,
                skip: (rawPage - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        const totalPages = Math.max(1, Math.ceil(totalCount / limit));
        return NextResponse.json(
            {
                data: transactions,
                pagination: {
                    page: rawPage,
                    totalPages,
                    totalCount,
                    hasMore: rawPage < totalPages,
                },
                appliedFilters: {
                    type: type as 'CREDIT' | 'DEBIT' | 'TRANSFER' | undefined,
                    categoryId,
                    accountId,
                    search,
                    dateFrom: searchParams.get('dateFrom') || undefined,
                    dateTo: searchParams.get('dateTo') || undefined,
                },
                appliedSort: { sortBy, sortDir },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'MEMBER');
        if (!access.ok) return access.response;

        const { workspaceId } = access;
        const body = await req.json();

        if (body?.type === 'TRANSFER') {
            const parsed = validateTransfer(body);
            if (!parsed.ok) {
                return NextResponse.json({ error: parsed.error }, { status: 400 });
            }
            const { fromAccountId, toAccountId, amount, date, note } = parsed.data;

            const accounts = await prisma.financialAccount.findMany({
                where: {
                    id: { in: [fromAccountId, toAccountId] },
                    workspaceId,
                    isActive: true,
                },
                select: { id: true, currency: true },
            });
            if (accounts.length !== 2) {
                return NextResponse.json(
                    { error: 'Both accounts must be active accounts in this workspace' },
                    { status: 400 },
                );
            }
            if (accounts[0].currency !== accounts[1].currency) {
                return NextResponse.json(
                    { error: 'Transfers between different currencies are not supported' },
                    { status: 400 },
                );
            }

            const transfer = await prisma.transaction.create({
                data: {
                    workspaceId,
                    type: 'TRANSFER',
                    amount,
                    description: note,
                    accountId: fromAccountId,
                    toAccountId,
                    categoryId: null,
                    createdAt: date,
                },
                include: TRANSACTION_INCLUDE,
            });

            await logAudit({
                actor: await userActor(access.userId),
                action: AUDIT_ACTIONS.TRANSFER_CREATED,
                resourceType: 'transaction',
                resourceId: transfer.id,
                workspaceId,
                metadata: {
                    type: transfer.type,
                    amount: transfer.amount,
                    fromAccountId,
                    toAccountId,
                },
            });

            return NextResponse.json(transfer, { status: 201 });
        }

        let validatedData;
        try {
            validatedData = validateTransactionData(body);
        } catch (err: unknown) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : 'Invalid transaction data' },
                { status: 400 },
            );
        }

        const { amount, type, description, categoryId, accountId, date } = validatedData;

        if (categoryId) {
            const categoryError = await getCategoryError(categoryId, workspaceId, {
                type,
                requireActive: true,
            });
            if (categoryError) return NextResponse.json({ error: categoryError }, { status: 400 });
        }

        // New transactions need an account of THIS workspace that is active
        if (accountId) {
            const accountError = await getAccountError(workspaceId, accountId, {
                requireActive: true,
            });
            if (accountError) {
                return NextResponse.json({ error: accountError }, { status: 400 });
            }
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount,
                type,
                description,
                workspaceId,
                categoryId,
                accountId,
                ...(date && { createdAt: date }),
            },
            include: TRANSACTION_INCLUDE,
        });

        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.TRANSACTION_CREATED,
            resourceType: 'transaction',
            resourceId: transaction.id,
            workspaceId,
            metadata: {
                type: transaction.type,
                amount: transaction.amount,
                targetName: transaction.description,
            },
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return NextResponse.json({ error: 'Invalid category or account' }, { status: 400 });
            }
        }
        console.error('Failed to create transaction:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
