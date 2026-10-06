import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { setMemberRole, removeMember } from '@/lib/admin/workspaces';

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
type Ctx = { params: Promise<{ workspaceId: string; userId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId, userId } = await params;
    const body = await req.json().catch(() => null);
    if (!ROLES.includes(body?.role))
        return NextResponse.json({ error: 'A valid role is required' }, { status: 400 });

    const result = await setMemberRole(workspaceId, userId, body.role);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: 'Role updated' });
}

export async function DELETE(_req: Request, { params }: Ctx) {
    const g = await requireAdmin();
    if (!g.ok) return g.response;
    const { workspaceId, userId } = await params;

    const result = await removeMember(workspaceId, userId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return new NextResponse(null, { status: 204 });
}
