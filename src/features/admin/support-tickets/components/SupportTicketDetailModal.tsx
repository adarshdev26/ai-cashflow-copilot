'use client';

import { Button, PrimaryButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { NEXT_STATUSES, STATUS_LABEL } from '@/features/support-tickets/status';
import { SupportTicketStatusBadge } from '@/features/support-tickets/components/SupportTicketStatusBadge';
import { formatAdminDate } from '@/features/admin/shared/lib/format-date';
import {
    useAdminSupportTicket,
    useAdminTicketStatusMutation,
} from '@/features/admin/support-tickets/hooks/use-admin-support-tickets';

export function SupportTicketDetailModal({
    ticketId,
    onClose,
}: {
    ticketId: string;
    onClose: () => void;
}) {
    const { data, isLoading, isError, error } = useAdminSupportTicket(ticketId);
    const mutation = useAdminTicketStatusMutation();
    const ticket = data?.ticket;
    const next = ticket ? NEXT_STATUSES[ticket.status] : [];

    const move = async (status: 'PROCESSING' | 'RESOLVED') => {
        if (!ticket) return;
        try {
            await mutation.mutateAsync({ id: ticket.id, status });
            notify.success(`Ticket marked ${STATUS_LABEL[status].toLowerCase()}`);
        } catch (cause) {
            notify.error(getErrorMessage(cause, 'Failed to update ticket'));
        }
    };

    return (
        <Modal
            open
            onClose={() => {
                if (!mutation.isPending) onClose();
            }}
            size="lg"
            title={ticket?.subject ?? 'Support ticket'}
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onClose}
                        disabled={mutation.isPending}
                    >
                        Close
                    </Button>
                    {next.map((status) => (
                        <PrimaryButton
                            key={status}
                            onClick={() => void move(status as 'PROCESSING' | 'RESOLVED')}
                            loading={mutation.isPending && mutation.variables?.status === status}
                            disabled={mutation.isPending}
                        >
                            Mark {STATUS_LABEL[status].toLowerCase()}
                        </PrimaryButton>
                    ))}
                </div>
            }
        >
            {isLoading ? (
                <p className="text-base-content/60 text-sm">Loading…</p>
            ) : isError || !ticket ? (
                <p className="text-error text-sm">
                    {getErrorMessage(error, 'Failed to load ticket.')}
                </p>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <SupportTicketStatusBadge status={ticket.status} />
                        <span className="text-base-content/60">
                            {ticket.user.name ?? ticket.user.email}
                            {ticket.user.name && ` · ${ticket.user.email}`}
                        </span>
                    </div>
                    <p className="border-base-300 bg-base-200/50 text-base-content/80 rounded-lg border p-3 text-sm whitespace-pre-wrap">
                        {ticket.message}
                    </p>
                    <dl className="text-base-content/60 grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <dt className="font-medium">Created</dt>
                            <dd>{formatAdminDate(ticket.createdAt)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Processing</dt>
                            <dd>
                                {ticket.processingAt ? formatAdminDate(ticket.processingAt) : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">Resolved</dt>
                            <dd>{ticket.resolvedAt ? formatAdminDate(ticket.resolvedAt) : '—'}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </Modal>
    );
}
