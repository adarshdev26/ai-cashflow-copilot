import { NextResponse } from 'next/server';
import { requireWorkspaceAction } from '@/lib/auth/workspaces';
import { parseCalendarParams } from '@/features/calendar/lib/validate-calendar';
import { loadCalendarMonth } from '@/features/calendar/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const access = await requireWorkspaceAction(req, 'workspace.read');
        if (!access.ok) return access.response;

        const parsed = parseCalendarParams(new URL(req.url).searchParams);
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const result = await loadCalendarMonth(access.workspaceId, parsed.params);
        if (!result.ok)
            return NextResponse.json({ error: result.error }, { status: result.status });

        return NextResponse.json(result.data);
    } catch (error) {
        console.error('Calendar error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
