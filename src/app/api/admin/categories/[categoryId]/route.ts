import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { CATEGORY_SELECT, parseCategoryInput } from '@/lib/categories';

type Context = { params: Promise<{ categoryId: string }> };

export async function PATCH(req: Request, { params }: Context) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { categoryId } = await params;
        const existing = await prisma.category.findFirst({
            where: { id: categoryId, workspaceId: null },
            select: { id: true },
        });
        if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

        const parsed = parseCategoryInput(await req.json().catch(() => null), true);
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
        if (parsed.data.name) {
            const conflict = await prisma.category.findFirst({
                where: {
                    name: { equals: parsed.data.name, mode: 'insensitive' },
                    id: { not: categoryId },
                },
                select: { id: true },
            });
            if (conflict)
                return NextResponse.json(
                    { error: 'A category with this name already exists' },
                    { status: 409 },
                );
        }

        const newType = parsed.data.type;
        if (newType && newType !== 'BOTH') {
            const oppositeType = newType === 'CREDIT' ? 'DEBIT' : 'CREDIT';
            const [transactions, schedules, templates] = await Promise.all([
                prisma.transaction.count({ where: { categoryId, type: oppositeType } }),
                prisma.recurringTransaction.count({ where: { categoryId, type: oppositeType } }),
                prisma.transactionTemplate.count({ where: { categoryId, type: oppositeType } }),
            ]);
            const incompatible = transactions + schedules + templates;
            if (incompatible > 0) {
                return NextResponse.json(
                    {
                        error: `${incompatible} existing transactions, schedules, or templates use the opposite type. Recategorize them first.`,
                    },
                    { status: 409 },
                );
            }
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: parsed.data,
            select: CATEGORY_SELECT,
        });
        return NextResponse.json(category);
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A category with this name already exists' },
                { status: 409 },
            );
        }
        console.error('Failed to update admin category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Context) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { categoryId } = await params;
        const existing = await prisma.category.findFirst({
            where: { id: categoryId, workspaceId: null },
            select: { id: true },
        });
        if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

        const [transactions, budgets, recurringTransactions, transactionTemplates] =
            await Promise.all([
                prisma.transaction.count({ where: { categoryId } }),
                prisma.budget.count({ where: { categoryId } }),
                prisma.recurringTransaction.count({ where: { categoryId } }),
                prisma.transactionTemplate.count({ where: { categoryId } }),
            ]);
        const usage = { transactions, budgets, recurringTransactions, transactionTemplates };
        if (budgets > 0 || recurringTransactions > 0) {
            return NextResponse.json(
                {
                    error: 'This category is still used by budgets or recurring schedules. Remove those references or deactivate the category instead.',
                    usage,
                },
                { status: 409 },
            );
        }

        await prisma.category.delete({ where: { id: categoryId } });
        return NextResponse.json({ id: categoryId, usage });
    } catch (error) {
        if ((error as { code?: string }).code === 'P2003') {
            return NextResponse.json(
                { error: 'This category is still referenced by data that prevents deletion.' },
                { status: 409 },
            );
        }
        console.error('Failed to delete admin category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
