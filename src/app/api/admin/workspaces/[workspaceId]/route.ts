import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { getSystemNumber } from '@/lib/settings/server';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId } = await params;

    const ws = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            isActive: true,
            createdAt: true,
            owner: { select: { id: true, name: true, email: true } },
            access: {
                orderBy: { createdAt: 'asc' },
                select: {
                    role: true,
                    user: { select: { id: true, name: true, email: true, isActive: true } },
                },
            },
        },
    });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const { access, ...rest } = ws;
    return NextResponse.json({
        workspace: {
            ...rest,
            members: access.map((a) => ({
                userId: a.user.id,
                name: a.user.name,
                email: a.user.email,
                isActive: a.user.isActive,
                role: a.role,
            })),
        },
    });
}

export async function PATCH(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId } = await params;
    const body = await req.json().catch(() => null);

    const data: { name?: string; currency?: string } = {};
    if (typeof body?.name === 'string') {
        const name = body.name.trim();
        const [minLength, maxLength] = await Promise.all([
            getSystemNumber('limits.workspaceNameMinLength'),
            getSystemNumber('limits.workspaceNameMaxLength'),
        ]);
        if (name.length < minLength || name.length > maxLength)
            return NextResponse.json(
                { error: `Name must be ${minLength}-${maxLength} characters` },
                { status: 400 },
            );
        data.name = name;
    }
    if (typeof body?.currency === 'string') {
        const currency = body.currency.trim().toUpperCase();
        if (!/^[A-Z]{3}$/.test(currency))
            return NextResponse.json(
                { error: 'Currency must be a 3-letter code' },
                { status: 400 },
            );
        data.currency = currency;
    }
    if (Object.keys(data).length === 0)
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    const exists = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true, currency: true },
    });
    if (!exists) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data,
        select: { id: true, name: true, currency: true },
    });
    const changes = {
        ...(exists.name !== workspace.name
            ? { name: { before: exists.name, after: workspace.name } }
            : {}),
        ...(exists.currency !== workspace.currency
            ? { currency: { before: exists.currency, after: workspace.currency } }
            : {}),
    };
    if (Object.keys(changes).length > 0) {
        await logAudit({
            actor: await adminActor(g.adminId),
            action: AUDIT_ACTIONS.WORKSPACE_UPDATED,
            resourceType: 'workspace',
            resourceId: workspace.id,
            workspaceId: workspace.id,
            metadata: { targetName: workspace.name, changes },
            request: req,
        });
    }
    return NextResponse.json({ workspace });
}

export async function DELETE(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId } = await params;

    const exists = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
    });
    if (!exists) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const [transactionCount, recurringCount, budgetCount] = await Promise.all([
        prisma.transaction.count({ where: { workspaceId } }),
        prisma.recurringTransaction.count({ where: { workspaceId } }),
        prisma.budget.count({ where: { workspaceId } }),
    ]);
    await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { workspaceId } }),
        prisma.recurringTransaction.deleteMany({ where: { workspaceId } }),
        prisma.budget.deleteMany({ where: { workspaceId } }),
        prisma.workspace.delete({ where: { id: workspaceId } }),
    ]);
    await logAudit({
        actor: await adminActor(g.adminId),
        action: AUDIT_ACTIONS.WORKSPACE_DELETED,
        resourceType: 'workspace',
        resourceId: exists.id,
        workspaceId: exists.id,
        metadata: {
            targetName: exists.name,
            deletedCounts: {
                transactions: transactionCount,
                recurring: recurringCount,
                budgets: budgetCount,
            },
        },
        request: req,
    });
    return new NextResponse(null, { status: 204 });
}
