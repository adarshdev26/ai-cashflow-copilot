import type { CreateTicketInput, MyTicket, Paged } from '../types';
import { toQueryString } from '../lib/query-string';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json as T;
}

export const supportTicketsApi = {
  list: (params: Record<string, unknown>) =>
    request<Paged<MyTicket>>(`/api/support/tickets${toQueryString(params)}`),
  create: (input: CreateTicketInput) =>
    request<{ ticket: { id: string } }>('/api/support/tickets', { method: 'POST', body: JSON.stringify(input) }),
};