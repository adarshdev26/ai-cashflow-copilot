import { STATUS_LABEL, type TicketStatus } from '@/features/support-tickets/status';

const STYLE: Record<TicketStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  PROCESSING: 'bg-info/10 text-info',
  RESOLVED: 'bg-success/10 text-success',
};

export function SupportTicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}