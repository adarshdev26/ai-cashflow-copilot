'use client';

import { Copy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { auditActionLabel, auditResourceLabel } from '@/lib/admin/audit-events';
import { useAuditLog } from '../hooks/use-audit-logs';
import {
    auditActorLabel,
    formatAuditFullDateTime,
    formatMetaValue,
    humanizeKey,
} from '../utils';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 gap-3 py-2 text-sm">
            <dt className="text-base-content/60">{label}</dt>
            <dd className="text-base-content col-span-2 break-words">{children}</dd>
        </div>
    );
}

function CopyId({ value }: { value: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <code className="text-xs break-all">{value}</code>
            <button
                type="button"
                aria-label="Copy ID"
                className="text-base-content/60 hover:text-base-content shrink-0"
                onClick={() => {
                    void navigator.clipboard.writeText(value);
                    notify.success('Copied');
                }}
            >
                <Copy className="h-3.5 w-3.5" />
            </button>
        </span>
    );
}

export function AuditLogDetails({
    eventId,
    onClose,
}: {
    eventId: string | null;
    onClose: () => void;
}) {
    const { data, isLoading, isError, error } = useAuditLog(eventId);
    const event = data?.event;
    const metaEntries = event?.metadata ? Object.entries(event.metadata) : [];

    return (
        <Modal open={!!eventId} onClose={onClose} title="Event details">
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-base-200 h-4 animate-pulse rounded" />
                    ))}
                </div>
            ) : isError || !event ? (
                <p className="text-error text-sm">
                    {getErrorMessage(error, 'Failed to load event.')}
                </p>
            ) : (
                <div className="space-y-4">
                    <dl className="divide-base-200 divide-y">
                        <Field label="Event ID">
                            <CopyId value={event.id} />
                        </Field>
                        <Field label="Time">{formatAuditFullDateTime(event.createdAt)}</Field>
                        <Field label="Action">{auditActionLabel(event.action)}</Field>
                        <Field label="Actor">
                            {auditActorLabel(event)}
                            {event.actorEmail && event.actorName ? (
                                <span className="text-base-content/60"> · {event.actorEmail}</span>
                            ) : null}
                            <span className="text-base-content/60"> ({event.actorType})</span>
                        </Field>
                        <Field label="Resource">
                            {auditResourceLabel(event.resourceType, event.resourceId)}
                        </Field>
                        {event.resourceId && (
                            <Field label="Resource ID">
                                <CopyId value={event.resourceId} />
                            </Field>
                        )}
                        {event.workspaceId && (
                            <Field label="Workspace ID">
                                <CopyId value={event.workspaceId} />
                            </Field>
                        )}
                        {event.ip && <Field label="IP">{event.ip}</Field>}
                        {event.userAgent && <Field label="Device">{event.userAgent}</Field>}
                    </dl>

                    {metaEntries.length > 0 && (
                        <div>
                            <p className="text-base-content mb-1 text-sm font-semibold">Details</p>
                            <dl className="divide-base-200 divide-y">
                                {metaEntries.map(([key, value]) => (
                                    <Field key={key} label={humanizeKey(key)}>
                                        {typeof value === 'object' && value !== null ? (
                                            <code className="text-xs break-all">
                                                {formatMetaValue(value)}
                                            </code>
                                        ) : (
                                            formatMetaValue(value)
                                        )}
                                    </Field>
                                ))}
                            </dl>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}