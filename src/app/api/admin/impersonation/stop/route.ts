import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { clearImpersonationSession } from '@/lib/admin/impersonation';
import { getSession } from '@/lib/auth/auth';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;

    const impersonatedUser = await getSession();
    await clearImpersonationSession();

    await logAudit({
        actor: await adminActor(g.adminId),
        action: AUDIT_ACTIONS.IMPERSONATION_ENDED,
        resourceType: 'user',
        resourceId: impersonatedUser?.userId,
        metadata: { targetEmail: impersonatedUser?.email ?? null },
        request: req,
    });

    return NextResponse.json({ ok: true, redirectTo: '/admin/users' }, { status: 200 });
}
