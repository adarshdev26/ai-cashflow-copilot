'use client';

import { Eye } from 'lucide-react';
import { auditActionLabel, auditResourceLabel } from '@/lib/admin/audit-events';
import type { AuditLogRow } from '../types';
import { auditActorLabel, formatAuditDateTime } from '../utils';

export function AuditLogListItem({
    event,
    onView,
}: {
    event: AuditLogRow;
    onView: (id: string) => void;
}) {
    return (
        <li className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
                <p className="text-base-content truncate text-sm font-medium">
                    <span>{auditActorLabel(event)}</span>
                    <span className="text-base-content/60 font-normal">
                        {' '}
                        · {auditActionLabel(event.action)}
                    </span>
                </p>
                <p className="text-base-content/60 truncate text-xs">
                    {auditResourceLabel(event.resourceType, event.resourceId)} ·{' '}
                    {formatAuditDateTime(event.createdAt)}
                </p>
            </div>
            <button
                type="button"
                onClick={() => onView(event.id)}
                aria-label="View event details"
                className="text-base-content/60 hover:bg-base-200 hover:text-base-content shrink-0 rounded-lg p-2 transition-colors"
            >
                <Eye className="h-4 w-4" />
            </button>
        </li>
    );
}