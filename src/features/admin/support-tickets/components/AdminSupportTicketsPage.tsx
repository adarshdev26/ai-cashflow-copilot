'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/lib/ui/toast';
import { TICKET_STATUSES, STATUS_LABEL, isTicketStatus } from '@/features/support-tickets/status';
import { useAdminTableState } from '../../shared/hooks/use-admin-table-state';
import { useAdminSupportTickets } from '../hooks/use-admin-support-tickets';
import type { AdminTicketFilters, AdminTicketRow, AdminTicketSortField } from '../types';
import { SupportTicketsTable } from './SupportTicketsTable';
import { SupportTicketDetailModal } from './SupportTicketDetailModal';

export function AdminSupportTicketsPage() {
  const table = useAdminTableState<AdminTicketFilters, AdminTicketSortField>({
    defaultFilters: { search: undefined, status: undefined },
    defaultSortBy: 'createdAt',
    defaultSortDir: 'desc',
  });
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminSupportTickets(table.list.params);
  const [openId, setOpenId] = useState<string | null>(null);

  const view = useCallback((ticket: AdminTicketRow) => setOpenId(ticket.id), []);

  const filtersActive = Boolean(table.globalFilter || table.list.filters.status);
  const empty = !isLoading && !isError && data?.pagination.totalCount === 0 && !filtersActive;

  return <div className="mx-auto max-w-7xl space-y-8">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-base-content">Support tickets</h1>
      <p className="text-sm text-base-content/60">Review requests from users and move them through processing to resolved.</p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <Select
        aria-label="Filter tickets by status"
        className="w-44"
        value={table.list.filters.status ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          table.list.setFilter('status', isTicketStatus(v) ? v : undefined);
        }}
      >
        <option value="">All statuses</option>
        {TICKET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </Select>
    </div>

    {isError && !data ? <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
      <p className="text-sm text-error">{getErrorMessage(error, 'Failed to load support tickets.')}</p>
      <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>Try again</Button>
    </div> : empty ? <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
      <p className="text-sm font-medium text-base-content">No support tickets yet.</p>
      <p className="mt-1 text-sm text-base-content/60">Tickets submitted by users will appear here.</p>
    </div> : <SupportTicketsTable
      data={data?.data ?? []}
      onView={view}
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
    />}

    {openId && <SupportTicketDetailModal key={openId} ticketId={openId} onClose={() => setOpenId(null)} />}
  </div>;
}