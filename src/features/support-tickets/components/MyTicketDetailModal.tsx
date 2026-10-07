'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import type { MyTicket } from '../types';
import { SupportTicketStatusBadge } from './SupportTicketStatusBadge';

export function MyTicketDetailModal({
    ticket,
    onClose,
}: {
    ticket: MyTicket;
    onClose: () => void;
}) {
    const locale = useUserLocale();
    const fmt = (v: string | null) => (v ? new Date(v).toLocaleString(locale) : '—');

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={ticket.subject}
            footer={
                <Button variant="secondary" onClick={onClose}>
                    <p className="text-error">Close</p>
                </Button>
            }
        >
            <div className="space-y-4">
                <SupportTicketStatusBadge status={ticket.status} />
                <p className="border-base-300 bg-base-200/50 text-base-content/80 rounded-lg border p-3 text-sm whitespace-pre-wrap">
                    {ticket.message}
                </p>
                <dl className="text-base-content/60 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <div>
                        <dt className="font-medium">Submitted</dt>
                        <dd>{fmt(ticket.createdAt)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">Processing since</dt>
                        <dd>{fmt(ticket.processingAt)}</dd>
                    </div>
                    <div>
                        <dt className="font-medium">Resolved</dt>
                        <dd>{fmt(ticket.resolvedAt)}</dd>
                    </div>
                </dl>
            </div>
        </Modal>
    );
}
