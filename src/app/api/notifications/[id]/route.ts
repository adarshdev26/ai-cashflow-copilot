import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { logAudit, userActor } from '@/lib/admin/audit';
import { AUDIT_ACTIONS, type AuditAction } from '@/lib/admin/audit-events';
import {
    setNotificationState,
    type NotificationStatePatch,
} from '@/features/notifications/lib/generate-notifications';
import { isNotificationType } from '@/features/notifications/types';
import { typeFromKey } from '@/features/notifications/lib/notifications';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

async function apply(request: Request, { params }: Ctx, action: NotificationStatePatch) {
    try {
        const access = await requireWorkspaceAccess(request, 'VIEWER');
        if (!access.ok) return access.response;

        const { id } = await params;
        let key = id;
        try {
            key = decodeURIComponent(id);
        } catch {}
        if (key.length > 200 || !isNotificationType(typeFromKey(key))) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const ok = await setNotificationState(access.workspaceId, access.userId, key, action);
        if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const auditAction: AuditAction =
            action === 'read'
                ? AUDIT_ACTIONS.NOTIFICATION_MARKED_READ
                : AUDIT_ACTIONS.NOTIFICATION_DISMISSED;
        await logAudit({
            actor: await userActor(access.userId),
            action: auditAction,
            resourceType: 'notification',
            workspaceId: access.workspaceId,
            metadata: { key },
        });
        return NextResponse.json({ id: key });
    } catch (error) {
        console.error('Failed to update notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const PATCH = (req: Request, ctx: Ctx) => apply(req, ctx, 'read');
export const DELETE = (req: Request, ctx: Ctx) => apply(req, ctx, 'dismiss');
