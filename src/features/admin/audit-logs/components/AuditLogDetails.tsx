'use client';

import { Copy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { auditActionLabel, auditResourceLabel } from '@/lib/admin/audit-events';
import { useAuditLog } from '../hooks/use-audit-logs';
import { auditActorLabel, formatAuditFullDateTime, humanizeKey } from '../utils';

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

/** Renders a single metadata value, choosing the best layout for its shape. */
function MetaValue({ value }: { value: unknown }) {
    if (value === null || value === undefined) {
        return <span className="text-base-content/50">—</span>;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return <>{String(value)}</>;
    }
    if (Array.isArray(value)) {
        return <JsonBlock value={value} />;
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        // Detect the { field: { before, after } } changes shape used by update audits.
        if (isChangesMap(obj)) {
            return <ChangesTable changes={obj} />;
        }
        return <JsonBlock value={obj} />;
    }
    return <>{String(value)}</>;
}

/** True when every own value is `{ before?, after? }`. */
function isChangesMap(
    obj: Record<string, unknown>,
): obj is Record<string, { before?: unknown; after?: unknown }> {
    const entries = Object.values(obj);
    if (entries.length === 0) return false;
    return entries.every(
        (v) =>
            v !== null &&
            typeof v === 'object' &&
            !Array.isArray(v) &&
            ('before' in (v as object) || 'after' in (v as object)),
    );
}

function ChangesTable({
    changes,
}: {
    changes: Record<string, { before?: unknown; after?: unknown }>;
}) {
    return (
        <div className="border-base-200 overflow-hidden rounded-md border text-sm">
            <table className="w-full">
                <thead className="bg-base-200/60 text-base-content/60 text-xs">
                    <tr>
                        <th className="px-2 py-1 text-left font-medium">Field</th>
                        <th className="px-2 py-1 text-left font-medium">Before</th>
                        <th className="px-2 py-1 text-left font-medium">After</th>
                    </tr>
                </thead>
                <tbody className="divide-base-200 divide-y">
                    {Object.entries(changes).map(([field, { before, after }]) => (
                        <tr key={field}>
                            <td className="text-base-content/70 px-2 py-1 align-top text-xs">
                                {humanizeKey(field)}
                            </td>
                            <td className="px-2 py-1 align-top">
                                <ChangeCell value={before} variant="before" />
                            </td>
                            <td className="px-2 py-1 align-top">
                                <ChangeCell value={after} variant="after" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ChangeCell({ value, variant }: { value: unknown; variant: 'before' | 'after' }) {
    if (value === null || value === undefined) {
        return <span className="text-base-content/40 italic">none</span>;
    }
    const text =
        typeof value === 'object'
            ? JSON.stringify(value)
            : typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value)
              ? // Shorten UUIDs to first 8 chars + ellipsis so rows stay readable.
                `${value.slice(0, 8)}…`
              : String(value);
    const tone = variant === 'before' ? 'text-error/80' : 'text-success/80';
    return (
        <span className={`${tone} font-mono text-xs break-all`} title={String(value)}>
            {text}
        </span>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="bg-base-200 text-base-content overflow-x-auto rounded-md p-2 text-xs">
            {JSON.stringify(value, null, 2)}
        </pre>
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
        <Modal size="xl" open={!!eventId} onClose={onClose} title="Event details">
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
                                        <MetaValue value={value} />
                                    </Field>
                                ))}
                            </dl>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={onClose}>
                            <p className="text-error">Close</p>
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
