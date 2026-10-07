'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '@/features/admin/shared/hooks/use-admin-table-state';

import { useMyTickets } from '../hooks/use-support-tickets';
import { TICKET_STATUSES, STATUS_LABEL, isTicketStatus } from '../status';
import type { MyTicket, MyTicketFilters, MyTicketSortField } from '../types';
import { MyTicketsTable } from './MyTicketsTable';
import { MyTicketDetailModal } from './MyTicketDetailModal';
import { SupportTicketFormModal } from './SupportTicketFormModal';

type StatusFilterProps = {
    value: string;
    onChange: (value: MyTicketFilters['status']) => void;
};

function PageHeader({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">Support</h1>
                <p className="text-base-content/60 text-sm">
                    Track your requests and raise a new one when you need help.
                </p>
            </div>

            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
                New ticket
            </Button>
        </div>
    );
}

function StatusFilter({ value, onChange }: StatusFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
                aria-label="Filter tickets by status"
                className="w-44"
                value={value}
                onChange={(e) => {
                    const next = e.target.value;
                    onChange(isTicketStatus(next) ? next : undefined);
                }}
            >
                <option value="">All statuses</option>

                {TICKET_STATUSES.map((status) => (
                    <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                    </option>
                ))}
            </FilterSelect>
        </div>
    );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
    return (
        <div className="border-error/30 bg-error/10 rounded-xl border p-6 text-center">
            <p className="text-error text-sm">
                {getErrorMessage(error, 'Failed to load your tickets.')}
            </p>

            <Button variant="secondary" className="mt-3" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="border-base-300 bg-base-100 rounded-xl border border-dashed p-10 text-center">
            <p className="text-base-content text-sm font-medium">
                You haven&apos;t raised any tickets.
            </p>
            <p className="text-base-content/60 mt-1 text-sm">
                Need help? Create a ticket and we&apos;ll email you with updates.
            </p>
        </div>
    );
}

export function SupportPage() {
    const table = useAdminTableState<MyTicketFilters, MyTicketSortField>({
        defaultFilters: { search: undefined, status: undefined },
        defaultSortBy: 'createdAt',
        defaultSortDir: 'desc',
    });

    const { data, isLoading, isFetching, isError, error, refetch } = useMyTickets(
        table.list.params,
    );

    const [creating, setCreating] = useState(false);
    const [viewing, setViewing] = useState<MyTicket | null>(null);

    const openTicket = useCallback((ticket: MyTicket) => setViewing(ticket), []);

    const statusFilter = table.list.filters.status;
    const filtersActive = Boolean(table.globalFilter || statusFilter);
    const totalCount = data?.pagination.totalCount ?? 0;
    const showError = isError && !data;
    const showEmpty = !isLoading && !isError && totalCount === 0 && !filtersActive;

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <PageHeader onCreate={() => setCreating(true)} />

            {showError ? (
                <ErrorState error={error} onRetry={() => void refetch()} />
            ) : showEmpty ? (
                <EmptyState />
            ) : (
                <MyTicketsTable
                    data={data?.data ?? []}
                    onView={openTicket}
                    pagination={table.paginationState}
                    sorting={table.sortingState}
                    globalFilter={table.globalFilter}
                    onPaginationChange={table.onPaginationChange}
                    onSortingChange={table.onSortingChange}
                    onGlobalFilterChange={table.onGlobalFilterChange}
                    pageCount={data?.pagination.totalPages ?? 1}
                    totalCount={totalCount}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    filters={
                        <StatusFilter
                            value={statusFilter ?? ''}
                            onChange={(status) => table.list.setFilter('status', status)}
                        />
                    }
                    activeFilterCount={statusFilter ? 1 : 0}
                    onClearFilters={() => table.list.setFilter('status', undefined)}
                />
            )}

            {creating && <SupportTicketFormModal onClose={() => setCreating(false)} />}

            {viewing && <MyTicketDetailModal ticket={viewing} onClose={() => setViewing(null)} />}
        </div>
    );
}
