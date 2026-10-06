import type { TicketStatus } from './status';
export type { Paged } from '@/features/admin/shared/types';

export type CreateTicketInput = { subject: string; message: string };

export type MyTicket = {
    id: string;
    subject: string;
    message: string;
    status: TicketStatus;
    createdAt: string;
    updatedAt: string;
    processingAt: string | null;
    resolvedAt: string | null;
};
export type MyTicketSortField = 'createdAt' | 'updatedAt' | 'status' | 'subject';
export type MyTicketFilters = { search?: string; status?: TicketStatus };
