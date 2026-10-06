import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireUserId } from '@/lib/auth/auth';
import { getUserWorkspaces, generateWorkspaceSlug } from '@/lib/auth/workspaces';
import { getSystemNumber, getSystemString } from '@/lib/settings/server';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function GET() {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({ workspaces: await getUserWorkspaces(userId) });
}

export async function POST(req: Request) {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const [minLength, maxLength, defaultAccountName] = await Promise.all([
        getSystemNumber('limits.workspaceNameMinLength'),
        getSystemNumber('limits.workspaceNameMaxLength'),
        getSystemString('workspace.defaultAccountName'),
    ]);
    if (name.length < minLength || name.length > maxLength) {
        return NextResponse.json(
            { error: `Name must be ${minLength}-${maxLength} characters` },
            { status: 400 },
        );
    }

    const workspace = await prisma.workspace.create({
        data: {
            name,
            slug: generateWorkspaceSlug(name),
            ownerId: userId,
            access: { create: { userId, role: 'OWNER' } },
            accounts: { create: { name: defaultAccountName, type: 'OTHER' } },
        },
        select: { id: true, name: true, slug: true },
    });

    await logAudit({
        actor: await userActor(userId),
        action: AUDIT_ACTIONS.WORKSPACE_CREATED,
        resourceType: 'workspace',
        resourceId: workspace.id,
        workspaceId: workspace.id,
        metadata: { targetName: workspace.name },
    });

    return NextResponse.json(
        {
            workspace: {
                workspaceId: workspace.id,
                role: 'OWNER',
                name: workspace.name,
                slug: workspace.slug,
            },
        },
        { status: 201 },
    );
}
