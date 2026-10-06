import { NextResponse } from 'next/server';
import { clearAuthCookie, getSession } from '@/lib/auth/auth';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        await clearAuthCookie();

        if (session) {
            await logAudit({
                actor: await userActor(session.userId),
                action: AUDIT_ACTIONS.USER_LOGGED_OUT,
                resourceType: 'user',
                resourceId: session.userId,
                request: req,
            });
        }

        return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
