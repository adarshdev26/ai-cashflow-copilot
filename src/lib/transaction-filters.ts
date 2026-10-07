import { TransactionType, type Prisma } from '@/generated/prisma';

export function parseDateParam(value: string | null, endOfDay = false): Date | undefined | null {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) d.setUTCHours(23, 59, 59, 999);
    return d;
}

export function buildTransactionWhere(f: {
    workspaceId: string;
    type?: 'CREDIT' | 'DEBIT' | 'TRANSFER' | null;
    categoryId?: string;
    accountId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}) {
    const where: Prisma.TransactionWhereInput = {
        workspaceId: f.workspaceId,
        ...(f.type ? { type: f.type } : {}),
        ...(f.categoryId ? { categoryId: f.categoryId } : {}),
        ...(f.search ? { description: { contains: f.search, mode: 'insensitive' as const } } : {}),
        ...(f.dateFrom || f.dateTo
            ? {
                createdAt: {
                    ...(f.dateFrom ? { gte: f.dateFrom } : {}),
                    ...(f.dateTo ? { lte: f.dateTo } : {}),
                },
            }
            : {}),
    };

    if (f.accountId) {
        where.AND = [
            ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
            { OR: [{ accountId: f.accountId }, { toAccountId: f.accountId }] },
        ];
    }

    return where;
}

/** Only these types count as income/expense. Transfers are excluded everywhere money is totalled. */
export const FINANCIAL_TYPES = [TransactionType.CREDIT, TransactionType.DEBIT];
