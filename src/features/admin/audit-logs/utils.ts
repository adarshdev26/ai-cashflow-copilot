import type { AuditLogRow } from './types';

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
});
const fullDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

/** "06 Oct, 02:15 pm" in the viewer's local time zone. */
export const formatAuditDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso));
export const formatAuditFullDateTime = (iso: string) =>
    fullDateTimeFormatter.format(new Date(iso));

type ActorFields = Pick<AuditLogRow, 'actorType' | 'actorName' | 'actorEmail'>;

export function auditActorLabel(e: ActorFields): string {
    if (e.actorName) return e.actorName;
    if (e.actorEmail) return e.actorEmail;
    return e.actorType === 'SYSTEM' ? 'System' : 'Unknown';
}

/** "createdAt" -> "Created at" */
export function humanizeKey(key: string): string {
    const spaced = key.replace(/([A-Z])/g, ' $1').replace(/[_.-]+/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function formatMetaValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}