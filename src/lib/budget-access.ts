import { requireWorkspaceAccess, requireWorkspaceAction } from '@/lib/workspaces';

type Ok = { ok: true; workspaceId: string };
type Fail = { ok: false; response: Response };

/** write=true requires budgets.manage; write=false only needs workspace membership. */
export async function budgetAccess(request: Request, write: boolean): Promise<Ok | Fail> {
  const result = write
    ? await requireWorkspaceAction(request as never, 'budgets.manage' as never)
    : await requireWorkspaceAccess(request as never);

  if (result instanceof Response) return { ok: false, response: result };
  return { ok: true, workspaceId: (result as { workspaceId: string }).workspaceId };
}