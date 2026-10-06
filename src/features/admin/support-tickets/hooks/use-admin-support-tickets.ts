import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSupportTicketsApi } from '../api/support-tickets-api';

export const ticketKeys = {
    all: ['admin-support-tickets'] as const,
    list: (params: unknown) => ['admin-support-tickets', 'list', params] as const,
    detail: (id: string) => ['admin-support-tickets', 'detail', id] as const,
};

export function useAdminSupportTickets(params: Record<string, unknown>) {
    return useQuery({
        queryKey: ticketKeys.list(params),
        queryFn: () => adminSupportTicketsApi.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useAdminSupportTicket(id: string | null) {
    return useQuery({
        queryKey: ticketKeys.detail(id ?? ''),
        queryFn: () => adminSupportTicketsApi.get(id!),
        enabled: !!id,
    });
}

export function useAdminTicketStatusMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (v: { id: string; status: 'PROCESSING' | 'RESOLVED' }) =>
            adminSupportTicketsApi.updateStatus(v.id, v.status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
    });
}
