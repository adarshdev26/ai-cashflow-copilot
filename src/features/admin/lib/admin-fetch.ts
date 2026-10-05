import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? 'Request failed', res.status);
  return data as T;
}

export function toQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  return sp.toString();
}

export function invalidateAdminData(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['admin-users'] }),
    qc.invalidateQueries({ queryKey: ['admin-workspaces'] }),
  ]);
}