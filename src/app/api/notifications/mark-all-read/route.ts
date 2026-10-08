import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS } from '@/lib/admin/audit-events';
import { markAllRead } from '@/features/notifications/lib/generate-notifications';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
    try {
        const access = await requireWorkspaceAccess(request, 'VIEWER');
        if (!access.ok) return access.response;

        const updated = await markAllRead(access.workspaceId, access.userId);
        await logAudit({
            actor: await userActor(access.userId),
            action: AUDIT_ACTIONS.NOTIFICATION_MARK_ALL_READ,
            resourceType: 'notification',
            workspaceId: access.workspaceId,
            metadata: { count: updated },
        });
        return NextResponse.json({ updated });
    } catch (error) {
        console.error('Failed to mark notifications read:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}