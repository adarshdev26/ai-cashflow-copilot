import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { computeNotifications } from '@/features/notifications/lib/generate-notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const access = await requireWorkspaceAccess(request, 'VIEWER');
        if (!access.ok) return access.response;
        const rows = await computeNotifications(access.workspaceId, access.userId);
        return NextResponse.json({
            unread: rows.filter((n) => !n.isRead).length,
            total: rows.length,
        });
    } catch (error) {
        console.error('Failed to count notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
