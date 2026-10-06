export const TICKET_STATUSES = ['PENDING', 'PROCESSING', 'RESOLVED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
    PENDING: ['PROCESSING', 'RESOLVED'],
    PROCESSING: ['RESOLVED'],
    RESOLVED: [],
};

export const canTransition = (from: TicketStatus, to: TicketStatus) =>
    NEXT_STATUSES[from].includes(to);

export const isTicketStatus = (v: unknown): v is TicketStatus =>
    typeof v === 'string' && (TICKET_STATUSES as readonly string[]).includes(v);

export const SUBJECT_MAX = 200;
export const MESSAGE_MAX = 5000;

export const STATUS_LABEL: Record<TicketStatus, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    RESOLVED: 'Resolved',
};
