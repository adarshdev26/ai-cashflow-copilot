import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { validateTransactionData } from '@/features/finance/lib/validate-transaction';
import { Prisma } from '@/generated/prisma';

// Offset pagination matches the existing numbered table controls and keeps this query compatible with useQuery.
const SORT_FIELDS = ['createdAt', 'amount', 'description', 'type'] as const;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
    const search = searchParams.get('search')?.trim() || undefined;
    const dateFrom = parseDate(searchParams.get('dateFrom'));
    const dateTo = parseDate(searchParams.get('dateTo'), true);

    if (!Number.isInteger(rawPage) || rawPage < 1) {
      return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 });
    }
    if (!Number.isInteger(rawLimit) || rawLimit < 1) {
      return NextResponse.json({ error: 'limit must be a positive integer' }, { status: 400 });
    }
    if (!SORT_FIELDS.includes(sortBy as (typeof SORT_FIELDS)[number])) {
      return NextResponse.json({ error: 'Invalid sortBy value' }, { status: 400 });
    }
    if (sortDir !== 'asc' && sortDir !== 'desc') {
      return NextResponse.json({ error: 'Invalid sortDir value' }, { status: 400 });
    }
    if (type !== null && type !== 'CREDIT' && type !== 'DEBIT') {
      return NextResponse.json({ error: 'Invalid type value' }, { status: 400 });
    }
    if (dateFrom === null || dateTo === null) {
      return NextResponse.json({ error: 'Invalid date value' }, { status: 400 });
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return NextResponse.json({ error: 'dateFrom must be before dateTo' }, { status: 400 });
    }

    const limit = Math.min(rawLimit, MAX_LIMIT);
    const where = {
      workspaceId,
      ...(type ? { type: type as 'CREDIT' | 'DEBIT' } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { description: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(dateFrom || dateTo
        ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
        : {}),
    };
    const orderBy = { [sortBy]: sortDir } as Record<string, 'asc' | 'desc'>;
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy,
        skip: (rawPage - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    return NextResponse.json({
      data: transactions,
      pagination: {
        page: rawPage,
        totalPages,
        totalCount,
        hasMore: rawPage < totalPages,
      },
      appliedFilters: {
        type: type as 'CREDIT' | 'DEBIT' | undefined,
        categoryId,
        search,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
      },
      appliedSort: { sortBy, sortDir },
    }, { status: 200 });
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

    let validatedData;
    try {
      validatedData = validateTransactionData(body);
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid transaction data' }, { status: 400 });
    }

    const { amount, type, description, categoryId } = validatedData;

    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        workspaceId,
        categoryId,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }
    console.error('Failed to create transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}