'use client';

import { useMemo } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { auditActionLabel, auditResourceLabel } from '@/lib/admin/audit-events';
import type { AuditLogRow } from '../types';
import { auditActorLabel, formatAuditDateTime } from '../utils';

type Props = {
    data: AuditLogRow[];
    onView: (id: string) => void;
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

export function AuditLogTable({ data, onView, ...table }: Props) {
    const columns = useMemo<ColumnDef<AuditLogRow>[]>(
        () => [
            {
                id: 'createdAt',
                header: 'Date',
                cell: ({ row }) => (
                    <span className="whitespace-nowrap">
                        {formatAuditDateTime(row.original.createdAt)}
                    </span>
                ),
            },
            {
                id: 'actor',
                header: 'Actor',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="min-w-0">
                        <p className="text-base-content truncate font-medium">
                            {auditActorLabel(row.original)}
                        </p>
                        <p className="text-base-content/50 text-xs">{row.original.actorType}</p>
                    </div>
                ),
            },
            {
                id: 'action',
                header: 'Action',
                enableSorting: false,
                cell: ({ row }) => auditActionLabel(row.original.action),
            },
            {
                id: 'resource',
                header: 'Resource',
                enableSorting: false,
                cell: ({ row }) =>
                    auditResourceLabel(row.original.resourceType, row.original.resourceId),
            },
            {
                id: 'view',
                header: '',
                enableSorting: false,
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => onView(row.original.id)}
                        aria-label="View event details"
                        className="text-base-content/60 hover:bg-base-200 hover:text-base-content rounded-lg p-2 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                ),
            },
        ],
        [onView],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="search"
            searchPlaceholder="Search actor or resource ID..."
            manualPagination
            manualSorting
            manualFiltering
            {...table}
        />
    );
}
