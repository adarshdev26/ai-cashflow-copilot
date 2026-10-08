'use client';

import { FilterDateRange } from '@/components/ui/FilterDateRange';
import { FilterSelect } from '@/components/ui/FilterSelect';
import type { ErrorLogFilters } from '../types';

export function ErrorLogFiltersBar({
    filters,
    onChange,
    error,
}: {
    filters: ErrorLogFilters;
    onChange: (key: keyof ErrorLogFilters, value: string | undefined) => void;
    error?: string;
}) {
    return (
        <>
            <FilterSelect
                aria-label="Filter by status"
                className="w-40 sm:w-48"
                value={filters.status ?? ''}
                onChange={(e) => onChange('status', e.target.value || undefined)}
            >
                <option value="">All statuses</option>
                <option value="5xx">Server errors (5xx)</option>
                <option value="429">Rate limited (429)</option>
                <option value="4xx">Client errors (4xx)</option>
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
