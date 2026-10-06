import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/generated/prisma';
import { templateAccess } from '@/lib/template-access';
import {
    validateTemplateInput,
    checkTemplateTargets,
    isTemplateNameTaken,
} from '@/features/transaction-templates/lib/validate-transaction-template';
import { requireUserId } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { enforceWorkspaceLimit } from '@/lib/plans/server';

export const dynamic = 'force-dynamic';

export const TEMPLATE_INCLUDE = {
    account: { select: { id: true, name: true, isActive: true } },
    category: { select: { id: true, name: true, color: true, isActive: true } },
} as const;

export async function GET(request: Request) {
    try {
        const access = await templateAccess(request, false);
        if (!access.ok) return access.response;

        const rows = await prisma.transactionTemplate.findMany({
            where: { workspaceId: access.workspaceId },
            include: TEMPLATE_INCLUDE,
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await templateAccess(request, true);
        if (!access.ok) return access.response;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const v = validateTemplateInput(body, { partial: false });
        if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
        const d = v.data;

        if (await isTemplateNameTaken(access.workspaceId, d.name!)) {
            return NextResponse.json(
                { error: 'A template with this name already exists' },
                { status: 400 },
            );
        }

        const targetErr = await checkTemplateTargets(
            access.workspaceId,
            d.type!,
            d.accountId ?? null,
            d.categoryId ?? null,
        );
        if (targetErr) return NextResponse.json({ error: targetErr }, { status: 400 });

        const blocked = await enforceWorkspaceLimit(access.workspaceId, 'maxTemplates');
        if (blocked) return blocked;

        const created = await prisma.transactionTemplate.create({
            data: {
                workspaceId: access.workspaceId,
                name: d.name!,
                type: d.type!,
                amount: d.amount ?? null,
                description: d.description ?? null,
                accountId: d.accountId ?? null,
                categoryId: d.categoryId ?? null,
                dateMode: d.dateMode!,
                fixedDate: d.fixedDate ?? null,
            },
            include: TEMPLATE_INCLUDE,
        });
        const userId = await requireUserId();
        await logAudit({
            actor: userId ? await userActor(userId) : { type: 'USER' },
            action: AUDIT_ACTIONS.TEMPLATE_CREATED,
            resourceType: 'template',
            resourceId: created.id,
            workspaceId: access.workspaceId,
            metadata: { targetName: created.name },
        });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'A template with this name already exists' },
                    { status: 400 },
                );
            }
            if (error.code === 'P2003') {
                return NextResponse.json({ error: 'Invalid category or account' }, { status: 400 });
            }
        }
        console.error('Failed to create template:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
