import { requireWorkspaceAccess, requireWorkspaceAction } from '@/lib/workspaces';

type Ok = { ok: true; workspaceId: string };
type Fail = { ok: false; response: Response };

/** write=true requires budgets.manage; write=false only needs workspace membership. */
export async function budgetAccess(request: Request, write: boolean): Promise<Ok | Fail> {
  const result = write
    ? await requireWorkspaceAction(request, 'budgets.manage')
    : await requireWorkspaceAccess(request);

  if (!result.ok) return { ok: false, response: result.response };
  return { ok: true, workspaceId: result.workspaceId };
}