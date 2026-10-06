import { NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/workspaces';
import { getWorkspaceSettings, updateWorkspaceSettings } from '@/lib/settings/server';

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(req: Request, { params }: Ctx) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'VIEWER', workspaceId);
        if (!access.ok) return access.response;
        return NextResponse.json({ values: await getWorkspaceSettings(access.workspaceId) });
    } catch (error) {
        console.error('Failed to load workspace settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: Ctx) {
    try {
        const { workspaceId } = await params;
        const access = await requireWorkspaceAccess(req, 'ADMIN', workspaceId); // OWNER or ADMIN
        if (!access.ok) return access.response;
        const body = await req.json().catch(() => null);
        const result = await updateWorkspaceSettings(
            access.workspaceId,
            access.userId,
            body?.values,
        );
        if (!result.ok)
            return NextResponse.json(
                { error: 'Invalid settings', errors: result.errors },
                { status: 400 },
            );
        return NextResponse.json({ values: result.values });
    } catch (error) {
        console.error('Failed to update workspace settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
