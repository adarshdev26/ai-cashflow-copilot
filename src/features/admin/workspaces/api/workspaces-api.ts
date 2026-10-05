import { apiFetch, toQuery } from '../../shared/api/admin-api';
import type { Paged, WorkspaceRole } from '../../shared/types';
import type { AdminWorkspaceDetail, AdminWorkspaceRow } from '../types';

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const base = '/api/admin/workspaces';

export const adminWorkspacesApi = {
  list: (params: Record<string, unknown>) => apiFetch<Paged<AdminWorkspaceRow>>(`${base}?${toQuery(params)}`),
  get: (id: string) => apiFetch<{ workspace: AdminWorkspaceDetail }>(`${base}/${id}`),
  update: (id: string, body: { name?: string; currency?: string }) => apiFetch(`${base}/${id}`, json('PATCH', body)),
  setStatus: (id: string, isActive: boolean) => apiFetch(`${base}/${id}/status`, json('PATCH', { isActive })),
  remove: (id: string) => apiFetch(`${base}/${id}`, json('DELETE')),
  addMember: (id: string, body: { email: string; role: WorkspaceRole }) => apiFetch(`${base}/${id}/members`, json('POST', body)),
  setMemberRole: (id: string, userId: string, role: WorkspaceRole) => apiFetch(`${base}/${id}/members/${userId}`, json('PATCH', { role })),
  removeMember: (id: string, userId: string) => apiFetch(`${base}/${id}/members/${userId}`, json('DELETE')),
};
