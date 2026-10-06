import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { hashPassword } from '@/lib/users/users';
import { getSystemNumber } from '@/lib/settings/server';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { userId } = await params;
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === 'string' ? body.password : '';
    const minPasswordLength = await getSystemNumber('auth.passwordMinLength');
    if (password.length < minPasswordLength || password.length > 72)
        return NextResponse.json(
            { error: `Password must be ${minPasswordLength}-72 characters` },
            { status: 400 },
        );

    const exists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
    });
    if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const hashed = await hashPassword(password);
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashed, passwordChangedAt: new Date() },
        }),
        prisma.passwordResetToken.deleteMany({ where: { userId } }),
    ]);
    await logAudit({
        actor: await adminActor(g.adminId),
        action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
        resourceType: 'user',
        resourceId: exists.id,
        metadata: { targetName: exists.name, targetEmail: exists.email },
        request: req,
    });
    return NextResponse.json({ message: 'Password updated' });
}
