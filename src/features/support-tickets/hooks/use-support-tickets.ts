import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportTicketsApi } from '../api/support-tickets-api';

export const myTicketKeys = {
    all: ['support-tickets'] as const,
    list: (params: unknown) => ['support-tickets', 'list', params] as const,
};

export function useMyTickets(params: Record<string, unknown>) {
    return useQuery({
        queryKey: myTicketKeys.list(params),
        queryFn: () => supportTicketsApi.list(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateSupportTicket() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: supportTicketsApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: myTicketKeys.all }),
    });
}
