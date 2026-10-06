import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import {
    USER_ROW_SELECT,
    toUserRow,
    normalizeEmail,
    EMAIL_RE,
    emailTaken,
} from '@/lib/admin/users';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_ROW_SELECT });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: toUserRow(user) });
}

export async function PATCH(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;
    const body = await req.json().catch(() => null);

    const data: { name?: string | null; email?: string } = {};
    if (typeof body?.name === 'string') data.name = body.name.trim() || null;
    if (typeof body?.email === 'string') {
        const email = normalizeEmail(body.email);
        if (!EMAIL_RE.test(email))
            return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
        if (await emailTaken(email, userId))
            return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
        data.email = email;
    }
    if (Object.keys(data).length === 0)
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    const exists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
    });
    if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, name: true, email: true },
    });
    const changes = {
        ...(exists.name !== user.name
            ? { name: { before: exists.name, after: user.name } }
            : {}),
        ...(exists.email !== user.email
            ? { email: { before: exists.email, after: user.email } }
            : {}),
    };
    if (Object.keys(changes).length > 0) {
        await logAudit({
            actor: await adminActor(g.adminId),
            action: AUDIT_ACTIONS.USER_UPDATED,
            resourceType: 'user',
            resourceId: user.id,
            metadata: { targetName: user.name, targetEmail: user.email, changes },
            request: req,
        });
    }
    return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const owned = await prisma.workspace.findMany({
        where: { ownerId: userId },
        select: { name: true },
    });
    if (owned.length > 0) {
        return NextResponse.json(
            {
                error: `This user owns ${owned.length} workspace(s): ${owned.map((w) => w.name).join(', ')}. Transfer ownership or delete those workspaces first.`,
            },
            { status: 409 },
        );
    }
    try {
        await prisma.user.delete({ where: { id: userId } });
        await logAudit({
            actor: await adminActor(g.adminId),
            action: AUDIT_ACTIONS.USER_DELETED,
            resourceType: 'user',
            resourceId: user.id,
            metadata: { targetName: user.name, targetEmail: user.email },
            request: _req,
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        const code =
            typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        if (code === 'P2025')
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (code === 'P2003')
            return NextResponse.json(
                { error: 'User cannot be deleted while related records still exist' },
                { status: 409 },
            );
        console.error('Admin user delete error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
