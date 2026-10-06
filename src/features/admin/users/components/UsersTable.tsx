'use client';

import { useMemo } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye, EyeOff, KeyRound, LogIn, Pencil, Trash2, UsersRound } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatAdminDate } from '../../shared/lib/format-date';
import type { AdminUserRow } from '../types';
import { PlanBadge } from '@/features/plans';

type Props = {
    data: AdminUserRow[];
    onEdit: (user: AdminUserRow) => void;
    onAccess: (user: AdminUserRow) => void;
    onOpenAccount: (user: AdminUserRow) => void;
    onPassword: (user: AdminUserRow) => void;
    onToggleStatus: (user: AdminUserRow) => void;
    onDelete: (user: AdminUserRow) => void;
    actionsDisabled: boolean;
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

export function UsersTable({
    data,
    onEdit,
    onAccess,
    onOpenAccount,
    onPassword,
    onToggleStatus,
    onDelete,
    actionsDisabled,
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
    const columns = useMemo<ColumnDef<AdminUserRow>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Name',
                cell: ({ row }) => (
                    <span className="block max-w-[16rem] truncate" title={row.original.name ?? ''}>
                        {row.original.name ?? '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ row }) => (
                    <span className="block max-w-[16rem] truncate" title={row.original.email}>
                        {row.original.email}
                    </span>
                ),
            },
            {
                id: 'isActive',
                header: 'Status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
            },
            {
                id: 'plan',
                header: 'Plan',
                enableSorting: false,
                cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
            },
            {
                id: 'workspaces',
                header: 'Workspaces',
                enableSorting: false,
                cell: ({ row }) => {
                    const workspaces = row.original.workspaces;
                    if (!workspaces.length)
                        return <span className="text-base-content/50">None</span>;
                    return (
                        <div className="flex flex-wrap gap-1">
                            {workspaces.slice(0, 3).map((w) => (
                                <span
                                    key={w.workspaceId}
                                    title={`${w.name} · ${w.role}`}
                                    className={`border-base-300 bg-base-200 max-w-44 truncate rounded-full border px-2 py-0.5 text-xs ${w.isActive ? '' : 'opacity-50'}`}
                                >
                                    {w.name} · {w.role}
                                </span>
                            ))}
                            {workspaces.length > 3 && (
                                <span className="text-base-content/60 text-xs">
                                    +{workspaces.length - 3}
                                </span>
                            )}
                        </div>
                    );
                },
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
                    const user = row.original;
                    return (
                        <div className="flex justify-end gap-1">
                            <button
                                type="button"
                                title="Edit user"
                                aria-label={`Edit ${user.email}`}
                                onClick={() => onEdit(user)}
                                disabled={actionsDisabled}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title="Workspace access"
                                aria-label={`Manage workspace access for ${user.email}`}
                                onClick={() => onAccess(user)}
                                disabled={actionsDisabled}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                <UsersRound className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title="Open account"
                                aria-label={`Open ${user.email} account`}
                                onClick={() => onOpenAccount(user)}
                                disabled={actionsDisabled}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                <LogIn className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title="Reset password"
                                aria-label={`Reset password for ${user.email}`}
                                onClick={() => onPassword(user)}
                                disabled={actionsDisabled}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                <KeyRound className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.email}`}
                                onClick={() => onToggleStatus(user)}
                                disabled={actionsDisabled}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                {user.isActive ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                title="Delete user"
                                aria-label={`Delete ${user.email}`}
                                onClick={() => onDelete(user)}
                                disabled={actionsDisabled}
                                className="text-error hover:bg-error/10 min-h-11 min-w-11 rounded p-2 disabled:pointer-events-none disabled:opacity-50 sm:min-h-0 sm:min-w-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [onEdit, onAccess, onOpenAccount, onPassword, onToggleStatus, onDelete, actionsDisabled],
    );
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="email"
            searchPlaceholder="Search name or email..."
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
