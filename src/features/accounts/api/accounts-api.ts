import { apiFetch, withWorkspace } from '@/lib/api-client';
import type { AccountWithBalance, CreateAccountInput, UpdateAccountInput } from '../types';

export async function getAccounts(
  workspaceId: string,
  options: { activeOnly?: boolean } = {}
): Promise<AccountWithBalance[]> {
  const query = options.activeOnly ? '?active=true' : '';
  // GET /api/accounts responds with { data: [...] }
  const res = await apiFetch<{ data: AccountWithBalance[] }>(
    `/api/accounts${query}`,
    withWorkspace(workspaceId)
  );
  return res.data;
}

export async function createAccount(
  workspaceId: string,
  data: CreateAccountInput
): Promise<AccountWithBalance> {
  return apiFetch<AccountWithBalance>('/api/accounts', {
    ...withWorkspace(workspaceId),
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAccount(
  workspaceId: string,
  accountId: string,
  data: UpdateAccountInput
): Promise<AccountWithBalance> {
  return apiFetch<AccountWithBalance>(`/api/accounts/${accountId}`, {
    ...withWorkspace(workspaceId),
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(
  workspaceId: string,
  accountId: string
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/accounts/${accountId}`, {
    ...withWorkspace(workspaceId),
    method: 'DELETE',
  });
}