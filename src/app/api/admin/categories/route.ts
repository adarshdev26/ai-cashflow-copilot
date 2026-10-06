import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { parseListParams, paginationMeta } from '@/lib/admin/list';
import { CATEGORY_SELECT, CATEGORY_TYPES, parseCategoryInput } from '@/lib/categories';
import { getSystemNumber } from '@/lib/settings/server';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function GET(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const url = new URL(req.url);
        const params = parseListParams(
            url,
            ['createdAt', 'name', 'type'],
            'name',
            await getSystemNumber('limits.listMaxPageSize'),
        );
        const type = url.searchParams.get('type');
        const where: Prisma.CategoryWhereInput = {
            workspaceId: null,
            ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
            ...(type && CATEGORY_TYPES.includes(type as (typeof CATEGORY_TYPES)[number])
                ? { type: type as (typeof CATEGORY_TYPES)[number] }
                : {}),
            ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {}),
        };

        const [rows, totalCount, customCategoryCount] = await Promise.all([
            prisma.category.findMany({
                where,
                select: {
                    ...CATEGORY_SELECT,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            transactions: true,
                            budgets: true,
                            recurringTransactions: true,
                            transactionTemplates: true,
                        },
                    },
                },
                orderBy: { [params.sortBy]: params.sortDir },
                skip: params.skip,
                take: params.limit,
            }),
            prisma.category.count({ where }),
            prisma.category.count({ where: { workspaceId: { not: null } } }),
        ]);

        const data = rows.map(({ _count, ...category }) => ({ ...category, usage: _count }));
        return NextResponse.json({
            data,
            pagination: paginationMeta(params.page, params.limit, totalCount),
            customCategoryCount,
        });
    } catch (error) {
        console.error('Failed to fetch admin categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function hasNameConflict(name: string, excludeId?: string) {
    return prisma.category.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' },
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
    });
}

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const parsed = parseCategoryInput(await req.json().catch(() => null));
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
        const { name, color, type } = parsed.data;
        const conflict = await hasNameConflict(name!);
        if (conflict)
            return NextResponse.json(
                { error: 'A category with this name already exists' },
                { status: 409 },
            );

        const category = await prisma.category.create({
            data: { name: name!, color: color ?? null, type: type ?? 'BOTH', workspaceId: null },
            select: CATEGORY_SELECT,
        });
        await logAudit({
            actor: await adminActor(guard.adminId),
            action: AUDIT_ACTIONS.CATEGORY_CREATED,
            resourceType: 'category',
            resourceId: category.id,
            metadata: { targetName: category.name },
            request: req,
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A category with this name already exists' },
                { status: 409 },
            );
        }
        console.error('Failed to create admin category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
