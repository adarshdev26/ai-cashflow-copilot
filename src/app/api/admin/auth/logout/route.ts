import { NextResponse } from 'next/server';
import { clearAdminCookie, getAdminSession } from '@/lib/admin/auth';
import { adminActor, logAudit } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    const session = await getAdminSession();
    await clearAdminCookie();
    if (session) {
        await logAudit({
            actor: await adminActor(session.adminId),
            action: AUDIT_ACTIONS.ADMIN_LOGGED_OUT,
            resourceType: 'admin',
            resourceId: session.adminId,
            request: req,
        });
    }
    return NextResponse.json({ message: 'Logged out' });
}
