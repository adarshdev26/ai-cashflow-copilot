'use client';

import { useState } from 'react';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useCreateSupportTicket } from '../hooks/use-support-tickets';
import { SUBJECT_MAX, MESSAGE_MAX } from '../status';

const field =
    'w-full rounded-md border border-base-300 bg-base-100 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-base-200';

export function SupportTicketFormModal({ onClose }: { onClose: () => void }) {
    const create = useCreateSupportTicket();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const busy = create.isPending;

    const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

    const subjectError = !subject.trim() ? 'Subject is required' : '';
    const messageError = !message.trim() ? 'Please describe your issue' : '';
    const showSubjectError = Boolean((touched.subject || submitted) && subjectError);
    const showMessageError = Boolean((touched.message || submitted) && messageError);

    const submit = async () => {
        setSubmitted(true);
        if (subjectError || messageError) return;
        setError(null);
        try {
            await create.mutateAsync({ subject: subject.trim(), message: message.trim() });
            notify.success("Ticket submitted. We'll email you with updates.");
            onClose();
        } catch (cause) {
            setError(getErrorMessage(cause, 'Failed to submit ticket'));
        }
    };

    return (
        <Modal
            open
            onClose={() => {
                if (!busy) onClose();
            }}
            title="New support ticket"
            description="Tell us what's wrong and we'll get back to you by email."
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <PrimaryButton onClick={() => void submit()} loading={busy}>
                        Submit ticket
                    </PrimaryButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="space-y-1">
                    <label
                        htmlFor="ticket-subject"
                        className="text-base-content/80 text-xs font-medium"
                    >
                        Subject
                    </label>
                    <input
                        id="ticket-subject"
                        autoFocus
                        className={field}
                        value={subject}
                        maxLength={SUBJECT_MAX}
                        aria-invalid={showSubjectError}
                        onChange={(e) => {
                            setSubject(e.target.value);
                            markTouched('subject');
                        }}
                        disabled={busy}
                        placeholder="Short summary"
                    />
                    {showSubjectError && <p className="text-error mt-1 text-xs">{subjectError}</p>}
                </div>
                <div className="space-y-1">
                    <label
                        htmlFor="ticket-message"
                        className="text-base-content/80 text-xs font-medium"
                    >
                        Message
                    </label>
                    <textarea
                        id="ticket-message"
                        className={`${field} min-h-32`}
                        value={message}
                        maxLength={MESSAGE_MAX}
                        aria-invalid={showMessageError}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            markTouched('message');
                        }}
                        disabled={busy}
                        placeholder="Describe your issue"
                    />
                    {showMessageError && <p className="text-error mt-1 text-xs">{messageError}</p>}
                    <p className="text-base-content/50 text-right text-xs">
                        {message.length}/{MESSAGE_MAX}
                    </p>
                </div>
                {error && <p className="text-error text-sm">{error}</p>}
            </div>
        </Modal>
    );
}
