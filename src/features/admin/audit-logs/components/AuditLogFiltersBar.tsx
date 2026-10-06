'use client';

import { AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from '@/lib/admin/audit-events';
import { Select } from '@/components/ui/Select';
import type { AuditLogFilters } from '../types';

const dateInputClass =
    'border-base-300 bg-base-100 focus:ring-primary/20 focus:border-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none';

export function AuditLogFiltersBar({
    filters,
    onChange,
}: {
    filters: AuditLogFilters;
    onChange: (key: keyof AuditLogFilters, value: string | undefined) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Select
                aria-label="Filter by action"
                className="w-52"
                value={filters.action ?? ''}
                onChange={(e) => onChange('action', e.target.value || undefined)}
            >
                <option value="">All actions</option>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </Select>
            <Select
                aria-label="Filter by resource type"
                className="w-44"
                value={filters.resourceType ?? ''}
                onChange={(e) => onChange('resourceType', e.target.value || undefined)}
            >
                <option value="">All resources</option>
                {Object.entries(AUDIT_RESOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </Select>
            <label className="text-base-content/60 flex items-center gap-2 text-xs">
                From
                <input
                    type="date"
                    className={dateInputClass}
                    value={filters.dateFrom ?? ''}
                    max={filters.dateTo || undefined}
                    onChange={(e) => onChange('dateFrom', e.target.value || undefined)}
                />
            </label>
            <label className="text-base-content/60 flex items-center gap-2 text-xs">
                To
                <input
                    type="date"
                    className={dateInputClass}
                    value={filters.dateTo ?? ''}
                    min={filters.dateFrom || undefined}
                    onChange={(e) => onChange('dateTo', e.target.value || undefined)}
                />
            </label>
        </div>
    );
}