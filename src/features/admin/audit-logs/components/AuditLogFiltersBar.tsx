'use client';

import { FilterDateRange } from '@/components/ui/FilterDateRange';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { AUDIT_ACTION_LABELS, AUDIT_RESOURCE_LABELS } from '@/lib/admin/audit-events';
import type { AuditLogFilters } from '../types';

export function AuditLogFiltersBar({
    filters,
    onChange,
    error,
}: {
    filters: AuditLogFilters;
    onChange: (key: keyof AuditLogFilters, value: string | undefined) => void;
    error?: string;
}) {
    return (
        <>
            <FilterSelect
                aria-label="Filter by action"
                className="w-40 sm:w-48"
                value={filters.action ?? ''}
                onChange={(e) => onChange('action', e.target.value || undefined)}
            >
                <option value="">All actions</option>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </FilterSelect>
            <FilterSelect
                aria-label="Filter by resource type"
                value={filters.resourceType ?? ''}
                onChange={(e) => onChange('resourceType', e.target.value || undefined)}
            >
                <option value="">All resources</option>
                {Object.entries(AUDIT_RESOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </FilterSelect>
            <FilterDateRange
                from={filters.dateFrom ?? ''}
                to={filters.dateTo ?? ''}
                onChange={({ from, to }) => {
                    onChange('dateFrom', from || undefined);
                    onChange('dateTo', to || undefined);
                }}
                error={error}
            />
        </>
    );
}
