import type { TicketStatus } from '@/features/support-tickets/status';

export type AdminTicketRow = {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
};

export type AdminTicketDetail = AdminTicketRow & {
  message: string;
  processingAt: string | null;
  resolvedAt: string | null;
};

export type AdminTicketSortField = 'createdAt' | 'updatedAt' | 'status' | 'subject';

// Must be a `type` alias (not an interface) to satisfy useAdminTableState's Record<string, unknown> constraint.
export type AdminTicketFilters = { search?: string; status?: TicketStatus };