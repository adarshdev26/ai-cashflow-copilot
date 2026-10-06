'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { getErrorMessage } from '@/lib/ui/toast';
import { useAdminTableState } from '@/features/admin/shared/hooks/use-admin-table-state';
import { useMyTickets } from '../hooks/use-support-tickets';
import { TICKET_STATUSES, STATUS_LABEL, isTicketStatus } from '../status';
import type { MyTicket, MyTicketFilters, MyTicketSortField } from '../types';
import { MyTicketsTable } from './MyTicketsTable';
import { MyTicketDetailModal } from './MyTicketDetailModal';
import { SupportTicketFormModal } from './SupportTicketFormModal';

export function SupportPage() {
  const table = useAdminTableState<MyTicketFilters, MyTicketSortField>({
    defaultFilters: { search: undefined, status: undefined },
    defaultSortBy: 'createdAt',
    defaultSortDir: 'desc',
  });
  const { data, isLoading, isFetching, isError, error, refetch } = useMyTickets(table.list.params);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<MyTicket | null>(null);
  const view = useCallback((ticket: MyTicket) => setViewing(ticket), []);

  const filtersActive = Boolean(table.globalFilter || table.list.filters.status);
  const empty = !isLoading && !isError && data?.pagination.totalCount === 0 && !filtersActive;

  return <div className="mx-auto max-w-7xl space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">Support</h1>
        <p className="text-sm text-base-content/60">Track your requests and raise a new one when you need help.</p>
      </div>
      <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>New ticket</Button>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <Select aria-label="Filter tickets by status" className="w-44" value={table.list.filters.status ?? ''}
        onChange={(e) => table.list.setFilter('status', isTicketStatus(e.target.value) ? e.target.value : undefined)}>
        <option value="">All statuses</option>
        {TICKET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
      </Select>
    </div>

    {isError && !data ? <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
      <p className="text-sm text-error">{getErrorMessage(error, 'Failed to load your tickets.')}</p>
      <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>Try again</Button>
    </div> : empty ? <div className="rounded-xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
      <p className="text-sm font-medium text-base-content">You haven't raised any tickets.</p>
      <p className="mt-1 text-sm text-base-content/60">Need help? Create a ticket and we'll email you with updates.</p>
    </div> : <MyTicketsTable data={data?.data ?? []} onView={view}
      pagination={table.paginationState} sorting={table.sortingState} globalFilter={table.globalFilter}
      onPaginationChange={table.onPaginationChange} onSortingChange={table.onSortingChange} onGlobalFilterChange={table.onGlobalFilterChange}
      pageCount={data?.pagination.totalPages ?? 1} totalCount={data?.pagination.totalCount ?? 0}
      isLoading={isLoading} isFetching={isFetching} />}

    {creating && <SupportTicketFormModal onClose={() => setCreating(false)} />}
    {viewing && <MyTicketDetailModal ticket={viewing} onClose={() => setViewing(null)} />}
  </div>;
}