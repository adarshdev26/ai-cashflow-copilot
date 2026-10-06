'use client';

import { useMemo } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye, EyeOff, Pencil, Trash2, UsersRound } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatAdminDate } from '../../shared/lib/format-date';
import type { AdminWorkspaceRow } from '../types';

type Props = {
    data: AdminWorkspaceRow[];
    onEdit: (workspace: AdminWorkspaceRow) => void;
    onMembers: (workspace: AdminWorkspaceRow) => void;
    onToggleStatus: (workspace: AdminWorkspaceRow) => void;
    onDelete: (workspace: AdminWorkspaceRow) => void;
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

export function WorkspacesTable({
    data,
    onEdit,
    onMembers,
    onToggleStatus,
    onDelete,
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
    const columns = useMemo<ColumnDef<AdminWorkspaceRow>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Name',
                cell: ({ row }) => (
                    <span className="block max-w-[16rem] truncate" title={row.original.name}>
                        {row.original.name}
                    </span>
                ),
            },
            {
                id: 'owner',
                header: 'Owner',
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="block max-w-[16rem] truncate" title={row.original.owner.email}>
                        {row.original.owner.email}
                    </span>
                ),
            },
            {
                id: 'memberCount',
                accessorFn: (row) => row.memberCount,
                header: 'Members',
                cell: ({ row }) => row.original.memberCount,
            },
            {
                id: 'accountCount',
                accessorFn: (row) => row.accountCount,
                header: 'Accounts',
                cell: ({ row }) => row.original.accountCount,
            },
            {
                id: 'categoryCount',
                accessorFn: (row) => row.categoryCount,
                header: 'Categories',
                cell: ({ row }) => row.original.categoryCount,
            },
            {
                id: 'isActive',
                header: 'Status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
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
                cell: ({ row }) => {
                    const workspace = row.original;
                    return (
                        <div className="flex justify-end gap-1">
                            <button
                                type="button"
                                title="Manage members"
                                aria-label={`Manage members of ${workspace.name}`}
                                onClick={() => onMembers(workspace)}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                <UsersRound className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title="Edit workspace"
                                aria-label={`Edit ${workspace.name}`}
                                onClick={() => onEdit(workspace)}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title={
                                    workspace.isActive
                                        ? 'Deactivate workspace'
                                        : 'Activate workspace'
                                }
                                aria-label={`${workspace.isActive ? 'Deactivate' : 'Activate'} ${workspace.name}`}
                                onClick={() => onToggleStatus(workspace)}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                {workspace.isActive ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                title="Delete workspace"
                                aria-label={`Delete ${workspace.name}`}
                                onClick={() => onDelete(workspace)}
                                className="text-error hover:bg-error/10 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [onEdit, onMembers, onToggleStatus, onDelete],
    );
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder="Search name, slug or owner email..."
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
