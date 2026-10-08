'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCardSkeleton } from '@/components/ui/StatCard';
import { getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { useSystemHealth, useSystemHealthErrors } from '../hooks/use-system-health';
import type { ErrorLogFilters, ErrorLogSortField } from '../types';
import { ErrorLogFiltersBar } from './ErrorLogFiltersBar';
import { ErrorsTable } from './ErrorsTable';
import { ServiceStatusCard } from './ServiceStatusCard';
import { SystemHealthBanner } from './SystemHealthBanner';
import { SystemHealthGuide } from './SystemHealthGuide';

export function SystemHealthPage() {
    const status = useSystemHealth();
    const table = useAdminTableState<ErrorLogFilters, ErrorLogSortField>({
        defaultFilters: {
            search: undefined,
            status: undefined,
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
    const errors = useSystemHealthErrors(table.list.params, !isInvalidDateRange);
    const refreshing = status.isFetching || errors.isFetching;

    const refresh = () => {
        void status.refetch();
        if (!isInvalidDateRange) void errors.refetch();
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-base-content text-2xl font-bold tracking-tight">
                        System health
                    </h1>
                    <p className="text-base-content/60 text-sm">
                        Platform services and recent errors. Status refreshes every 30 seconds.
                    </p>
                </div>
                <Button variant="secondary" onClick={refresh} aria-busy={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <section className="space-y-4">
                {status.isError && !status.data ? (
                    <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                        <p className="text-error text-sm">
                            {getErrorMessage(status.error, 'Failed to load system status.')}
                        </p>
                        <Button
                            variant="secondary"
                            className="mt-3"
                            onClick={() => void status.refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : (
                    <>
                        {status.data && <SystemHealthBanner services={status.data.services} />}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {status.data
                                ? status.data.services.map((s) => (
                                      <ServiceStatusCard key={s.id} service={s} />
                                  ))
                                : Array.from({ length: 4 }).map((_, i) => (
                                      <StatCardSkeleton key={i} />
                                  ))}
                        </div>
                        {status.data && <SystemHealthGuide guide={status.data.guide} />}
                    </>
                )}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-base-content text-lg font-semibold">Recent errors</h2>
                    <p className="text-base-content/60 text-sm">
                        Newest first. Open "How to read this page" above to see what each code
                        means.
                    </p>
                </div>
                {errors.isError && !errors.data ? (
                    <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
                        <p className="text-error text-sm">
                            {getErrorMessage(errors.error, 'Failed to load errors.')}
                        </p>
                        <Button
                            variant="secondary"
                            className="mt-3"
                            onClick={() => void errors.refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : (
                    <ErrorsTable
                        data={errors.data?.data ?? []}
                        pagination={table.paginationState}
                        sorting={table.sortingState}
                        globalFilter={table.globalFilter}
                        onPaginationChange={table.onPaginationChange}
                        onSortingChange={table.onSortingChange}
                        onGlobalFilterChange={table.onGlobalFilterChange}
                        pageCount={errors.data?.pagination.totalPages ?? 1}
                        totalCount={errors.data?.pagination.totalCount ?? 0}
                        isLoading={errors.isLoading}
                        isFetching={errors.isFetching}
                        filters={
                            <ErrorLogFiltersBar
                                filters={table.list.filters}
                                onChange={(key, value) =>
                                    table.list.setFilter(key, value as ErrorLogFilters[typeof key])
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
            </section>
        </div>
    );
}
