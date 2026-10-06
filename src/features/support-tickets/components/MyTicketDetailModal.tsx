'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import type { MyTicket } from '../types';
import { SupportTicketStatusBadge } from './SupportTicketStatusBadge';

export function MyTicketDetailModal({ ticket, onClose }: { ticket: MyTicket; onClose: () => void }) {
  const locale = useUserLocale();
  const fmt = (v: string | null) => (v ? new Date(v).toLocaleString(locale) : '—');

  return (
    <Modal open onClose={onClose} size="lg" title={ticket.subject}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-4">
        <SupportTicketStatusBadge status={ticket.status} />
        <p className="whitespace-pre-wrap rounded-lg border border-base-300 bg-base-200/50 p-3 text-sm text-base-content/80">{ticket.message}</p>
        <dl className="grid grid-cols-1 gap-2 text-xs text-base-content/60 sm:grid-cols-3">
          <div><dt className="font-medium">Submitted</dt><dd>{fmt(ticket.createdAt)}</dd></div>
          <div><dt className="font-medium">Processing since</dt><dd>{fmt(ticket.processingAt)}</dd></div>
          <div><dt className="font-medium">Resolved</dt><dd>{fmt(ticket.resolvedAt)}</dd></div>
        </dl>
      </div>
    </Modal>
  );
}