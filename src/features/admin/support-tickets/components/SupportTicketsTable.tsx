'use client';

import { useMemo } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { formatAdminDate } from '../../shared/lib/format-date';
import type { AdminTicketRow } from '../types';
import { SupportTicketStatusBadge } from '../../../support-tickets/components/SupportTicketStatusBadge';

type Props = {
    data: AdminTicketRow[];
    onView: (ticket: AdminTicketRow) => void;
    pagination: PaginationState;
    sorting: SortingState;
    globalFilter: string;
    onPaginationChange: OnChangeFn<PaginationState>;
    onSortingChange: OnChangeFn<SortingState>;
    onGlobalFilterChange: OnChangeFn<string>;
    pageCount: number;
    totalCount: number;
    isLoading: boolean;
    isFetching: boolean;
};

export function SupportTicketsTable({
    data,
    onView,
    pagination,
    sorting,
    globalFilter,
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange,
    pageCount,
    totalCount,
    isLoading,
    isFetching,
}: Props) {
    const columns = useMemo<ColumnDef<AdminTicketRow>[]>(
        () => [
            {
                accessorKey: 'subject',
                header: 'Subject',
                cell: ({ row }) => (
                    <span className="text-base-content block max-w-xs truncate font-medium">
                        {row.original.subject}
                    </span>
                ),
            },
            {
                id: 'user',
                header: 'Requester',
                enableSorting: false,
                cell: ({ row }) => {
                    const { name, email } = row.original.user;
                    return (
                        <div className="min-w-0">
                            <p className="truncate">{name ?? email}</p>
                            {name && (
                                <p className="text-base-content/50 truncate text-xs">{email}</p>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => <SupportTicketStatusBadge status={row.original.status} />,
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({ row }) => formatAdminDate(row.original.createdAt),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            title="View ticket"
                            aria-label={`View ticket ${row.original.subject}`}
                            onClick={() => onView(row.original)}
                            className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [onView],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="subject"
            searchPlaceholder="Search by subject or requester..."
            manualPagination
            manualSorting
            manualFiltering
            pageCount={pageCount}
            totalCount={totalCount}
            pageSize={pagination.pageSize}
            pagination={pagination}
            sorting={sorting}
            globalFilter={globalFilter}
            onPaginationChange={onPaginationChange}
            onSortingChange={onSortingChange}
            onGlobalFilterChange={onGlobalFilterChange}
            isLoading={isLoading}
            isFetching={isFetching}
        />
    );
}
