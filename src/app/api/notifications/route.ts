import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { computeNotifications } from '@/features/notifications/lib/generate-notifications';
import { isNotificationType } from '@/features/notifications/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const access = await requireWorkspaceAccess(request, 'VIEWER');
        if (!access.ok) return access.response;

        const sp = new URL(request.url).searchParams;
        const read = sp.get('read') ?? 'all';
        const type = sp.get('type');
        if (!['all', 'true', 'false'].includes(read)) {
            return NextResponse.json({ error: 'Invalid read filter' }, { status: 400 });
        }
        if (type && !isNotificationType(type)) {
            return NextResponse.json({ error: 'Invalid type filter' }, { status: 400 });
        }
        const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10) || 20));

        let rows = await computeNotifications(access.workspaceId, access.userId);
        if (read !== 'all') rows = rows.filter((n) => n.isRead === (read === 'true'));
        if (type) rows = rows.filter((n) => n.type === type);

        const totalCount = rows.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));
        return NextResponse.json({
            data: rows.slice((page - 1) * limit, page * limit),
            pagination: { page, limit, totalCount, totalPages, hasMore: page < totalPages },
        });
    } catch (error) {
        console.error('Failed to list notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}