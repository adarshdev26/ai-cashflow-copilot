import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setImpersonationCookie } from '@/lib/admin/impersonation';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const { userId } = await params;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, isActive: true, onboardingCompletedAt: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isActive) {
        return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403 });
    }

    if (!user.onboardingCompletedAt) {
        return NextResponse.json(
            { error: 'This user must finish onboarding before impersonation.' },
            { status: 403 },
        );
    }

    await setImpersonationCookie({ id: user.id, email: user.email }, g.adminId);

    await logAudit({
        actor: await adminActor(g.adminId),
        action: AUDIT_ACTIONS.IMPERSONATION_STARTED,
        resourceType: 'user',
        resourceId: user.id,
        metadata: { targetEmail: user.email },
        request: req,
    });

    return NextResponse.json({ ok: true, redirectTo: '/dashboard' }, { status: 200 });
}
