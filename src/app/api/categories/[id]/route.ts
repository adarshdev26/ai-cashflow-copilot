import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAccess } from '@/lib/workspaces';
import { CATEGORY_SELECT, findNameConflict, loadCustomCategory, parseCategoryInput } from '@/lib/categories';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const access = await requireWorkspaceAccess(req, 'ADMIN');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await ctx.params;

        const target = await loadCustomCategory(id, workspaceId);
        if (!target.ok) return NextResponse.json({ error: target.error }, { status: target.status });

        const parsed = parseCategoryInput(await req.json().catch(() => null), true);
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

        if (parsed.data.name) {
            const conflict = await findNameConflict(workspaceId, parsed.data.name, id);
            if (conflict) {
                return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
            }
        }

        const newType = parsed.data.type;
        if (newType && newType !== 'BOTH') {
            const opposite = await prisma.transaction.count({
                where: { categoryId: id, workspaceId, type: newType === 'CREDIT' ? 'DEBIT' : 'CREDIT' },
            });
            if (opposite > 0) {
                return NextResponse.json(
                    { error: `${opposite} existing transactions use the opposite type. Recategorize them first.` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.category.update({ where: { id }, data: parsed.data, select: CATEGORY_SELECT });
        return NextResponse.json(updated);
    } catch (error) {
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
        }
        console.error('Failed to update category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, ctx: Ctx) {
    try {
        const access = await requireWorkspaceAccess(req, 'ADMIN');
        if (!access.ok) return access.response;
        const { workspaceId } = access;
        const { id } = await ctx.params;

        const target = await loadCustomCategory(id, workspaceId);
        if (!target.ok) return NextResponse.json({ error: target.error }, { status: target.status });

        const budgetCount = await prisma.budget.count({ where: { categoryId: id } });
        if (budgetCount > 0) {
            return NextResponse.json(
                { error: 'This category has budgets. Remove its budgets first, or deactivate the category instead.' },
                { status: 409 }
            );
        }

        const affectedTransactions = await prisma.transaction.count({ where: { categoryId: id, workspaceId } });
        await prisma.category.delete({ where: { id } }); // onDelete: SetNull leaves the transactions uncategorized
        return NextResponse.json({ id, affectedTransactions });
    } catch (error) {
        console.error('Failed to delete category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}