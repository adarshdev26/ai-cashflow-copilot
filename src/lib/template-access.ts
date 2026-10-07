import { requireWorkspaceAccess, requireWorkspaceAction } from '@/lib/auth/workspaces';

type Ok = { ok: true; workspaceId: string };
type Fail = { ok: false; response: Response };

export async function templateAccess(request: Request, write: boolean): Promise<Ok | Fail> {
    const result = write
        ? await requireWorkspaceAction(request, 'templates.manage')
        : await requireWorkspaceAccess(request);
    if (!result.ok) return { ok: false, response: result.response };
    return { ok: true, workspaceId: result.workspaceId };
}
