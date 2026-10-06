import { apiFetch } from '../../shared/api/admin-api';
import type { Paged } from '../../shared/types';
import { toQueryString } from '@/features/support-tickets/lib/query-string';
import type { AdminTicketRow, AdminTicketDetail } from '../types';

export const adminSupportTicketsApi = {
    list: (params: Record<string, unknown>) =>
        apiFetch<Paged<AdminTicketRow>>(`/api/admin/support-tickets${toQueryString(params)}`),
    get: (id: string) =>
        apiFetch<{ ticket: AdminTicketDetail }>(`/api/admin/support-tickets/${id}`),
    updateStatus: (id: string, status: 'PROCESSING' | 'RESOLVED') =>
        apiFetch<{ ticket: AdminTicketDetail }>(`/api/admin/support-tickets/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
};
