'use client';

import { useMemo } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import type { MyTicket } from '../types';
import { SupportTicketStatusBadge } from './SupportTicketStatusBadge';

type Props = {
    data: MyTicket[];
    onView: (ticket: MyTicket) => void;
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

export function MyTicketsTable({
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
    const locale = useUserLocale();
    const columns = useMemo<ColumnDef<MyTicket>[]>(
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
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => <SupportTicketStatusBadge status={row.original.status} />,
            },
            {
                accessorKey: 'createdAt',
                header: 'Submitted',
                cell: ({ row }) => (
                    <span className="text-base-content/60">
                        {new Date(row.original.createdAt).toLocaleDateString(locale)}
                    </span>
                ),
            },
            {
                accessorKey: 'updatedAt',
                header: 'Last update',
                cell: ({ row }) => (
                    <span className="text-base-content/60">
                        {new Date(row.original.updatedAt).toLocaleDateString(locale)}
                    </span>
                ),
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
        [onView, locale],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="subject"
            searchPlaceholder="Search my tickets..."
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
