'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatAuditDateTime, formatAuditFullDateTime } from '../../audit-logs/utils';
import type { ErrorLogRow } from '../types';

type Props = {
    data: ErrorLogRow[];
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
    filters?: ReactNode;
    activeFilterCount?: number;
    onClearFilters?: () => void;
};

function StatusCodeBadge({ status }: { status: number }) {
    const className =
        status >= 500
            ? 'border-error/30 bg-error/10 text-error'
            : status === 429
              ? 'border-warning/30 bg-warning/10 text-warning'
              : 'border-base-300 bg-base-200 text-base-content/70';
    return (
        <span
            className={`rounded-full border px-2 py-0.5 font-mono text-xs font-medium ${className}`}
        >
            {status}
        </span>
    );
}

export function ErrorsTable({ data, ...table }: Props) {
    const columns = useMemo<ColumnDef<ErrorLogRow>[]>(
        () => [
            {
                id: 'createdAt',
                accessorFn: (row) => row.createdAt,
                header: 'Time',
                cell: ({ row }) => (
                    <span
                        className="whitespace-nowrap"
                        title={formatAuditFullDateTime(row.original.createdAt)}
                    >
                        {formatAuditDateTime(row.original.createdAt)}
                    </span>
                ),
            },
            {
                id: 'method',
                accessorFn: (row) => row.method,
                header: 'Method',
                cell: ({ row }) => (
                    <span className="bg-base-200 rounded px-1.5 py-0.5 font-mono text-xs">
                        {row.original.method}
                    </span>
                ),
            },
            {
                id: 'path',
                accessorFn: (row) => row.path,
                header: 'Endpoint',
                cell: ({ row }) => (
                    <span
                        className="block max-w-[260px] truncate font-mono text-xs"
                        title={row.original.path}
                    >
                        {row.original.path}
                    </span>
                ),
            },
            {
                id: 'status',
                accessorFn: (row) => row.status,
                header: 'Status',
                cell: ({ row }) => <StatusCodeBadge status={row.original.status} />,
            },
            {
                id: 'message',
                header: 'Message',
                enableSorting: false,
                cell: ({ row }) => (
                    <span
                        className="text-base-content/70 block max-w-[320px] truncate text-xs"
                        title={row.original.message}
                    >
                        {row.original.message}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="search"
            searchPlaceholder="Search endpoint or message..."
            filters={table.filters}
            activeFilterCount={table.activeFilterCount}
            onClearFilters={table.onClearFilters}
            manualPagination
            manualSorting
            manualFiltering
            {...table}
        />
    );
}
