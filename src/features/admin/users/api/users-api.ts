import { apiFetch, toQuery } from '../../shared/api/admin-api';
import type { Paged } from '../../shared/types';
import type { AdminUserRow } from '../types';

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const adminUsersApi = {
  list: (params: Record<string, unknown>) => apiFetch<Paged<AdminUserRow>>(`/api/admin/users?${toQuery(params)}`),
  get: (id: string) => apiFetch<{ user: AdminUserRow }>(`/api/admin/users/${id}`),
  create: (body: { name?: string; email: string; password: string }) => apiFetch('/api/admin/users', json('POST', body)),
  update: (id: string, body: { name?: string; email?: string }) => apiFetch(`/api/admin/users/${id}`, json('PATCH', body)),
  setStatus: (id: string, isActive: boolean) => apiFetch(`/api/admin/users/${id}/status`, json('PATCH', { isActive })),
  resetPassword: (id: string, password: string) => apiFetch(`/api/admin/users/${id}/password`, json('POST', { password })),
  impersonate: (id: string) => apiFetch<{ ok: true; redirectTo: string }>(`/api/admin/users/${id}/impersonate`, json('POST')),
  remove: (id: string) => apiFetch(`/api/admin/users/${id}`, json('DELETE')),
};
