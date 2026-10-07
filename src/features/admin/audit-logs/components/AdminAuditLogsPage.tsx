'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { adminAuditLogsApi } from '../api/audit-logs-api';
import type { AuditLogFilters, AuditLogSortField } from '../types';
import { AuditLogDetails } from './AuditLogDetails';
import { AuditLogFiltersBar } from './AuditLogFiltersBar';
import { AuditLogTable } from './AuditLogTable';

export function AdminAuditLogsPage() {
    const table = useAdminTableState<AuditLogFilters, AuditLogSortField>({
        defaultFilters: {
            search: undefined,
            action: undefined,
            resourceType: undefined,
            dateFrom: undefined,
            dateTo: undefined,
        },
        defaultSortBy: 'createdAt',
        defaultSortDir: 'desc',
    });
    const isInvalidDateRange = Boolean(
        table.list.filters.dateFrom &&
        table.list.filters.dateTo &&
        table.list.filters.dateFrom > table.list.filters.dateTo,
    );
    const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
        queryKey: ['admin-audit-logs', 'list', table.list.params],
        queryFn: () => adminAuditLogsApi.list(table.list.params),
        placeholderData: (previous) => previous,
        enabled: !isInvalidDateRange,
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">Audit logs</h1>
                <p className="text-base-content/60 text-sm">
                    A record of important actions across users and workspaces.
                </p>
            </div>

            {isError && !data ? (
                <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load audit logs.')}
                    </p>
                    <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : (
                <AuditLogTable
                    data={data?.data ?? []}
                    onView={setSelectedId}
                    pagination={table.paginationState}
                    sorting={table.sortingState}
                    globalFilter={table.globalFilter}
                    onPaginationChange={table.onPaginationChange}
                    onSortingChange={table.onSortingChange}
                    onGlobalFilterChange={table.onGlobalFilterChange}
                    pageCount={data?.pagination.totalPages ?? 1}
                    totalCount={data?.pagination.totalCount ?? 0}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    filters={
                        <AuditLogFiltersBar
                            filters={table.list.filters}
                            onChange={(key, value) =>
                                table.list.setFilter(key, value as AuditLogFilters[typeof key])
                            }
                            error={
                                isInvalidDateRange
                                    ? '"From" date must be on or before the "To" date.'
                                    : undefined
                            }
                        />
                    }
                    activeFilterCount={table.activeFilterCount}
                    onClearFilters={table.clearFilters}
                />
            )}

            <AuditLogDetails eventId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
    );
}
