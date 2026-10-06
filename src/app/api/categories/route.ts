import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import {
    CATEGORY_SELECT,
    findNameConflict,
    parseCategoryInput,
    visibleCategoryWhere,
} from '@/lib/categories';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'VIEWER');
        if (!access.ok) return access.response;

        const categories = await prisma.category.findMany({
            where: visibleCategoryWhere(access.workspaceId),
            select: CATEGORY_SELECT,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const access = await requireWorkspaceAccess(req, 'MEMBER');
        if (!access.ok) return access.response;
        const { workspaceId } = access;

        const parsed = parseCategoryInput(await req.json().catch(() => null));
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
        const { name, color, type } = parsed.data;

        const conflict = await findNameConflict(workspaceId, name!);
        if (conflict) {
            return NextResponse.json(
                {
                    error: conflict.workspaceId
                        ? 'A category with this name already exists in this workspace'
                        : 'A default category with this name already exists',
                },
                { status: 409 },
            );
        }

        const blocked = await enforceWorkspaceLimit(workspaceId, 'maxCustomCategories');
        if (blocked) return blocked;

        const created = await prisma.category.create({
            data: { name: name!, color: color ?? null, type: type ?? 'BOTH', workspaceId },
            select: CATEGORY_SELECT,
        });
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.CATEGORY_CREATED,
            resourceType: 'category',
            resourceId: created.id,
            workspaceId,
            metadata: { targetName: created.name },
        });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        // two requests racing with the same name hit the composite unique
        if ((error as { code?: string }).code === 'P2002') {
            return NextResponse.json(
                { error: 'A category with this name already exists' },
                { status: 409 },
            );
        }
        console.error('Failed to create category:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
