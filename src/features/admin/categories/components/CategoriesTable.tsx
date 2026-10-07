'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatAdminDate } from '../../shared/lib/format-date';
import type { AdminCategoryRow } from '../types';

type Props = {
    data: AdminCategoryRow[];
    onEdit: (category: AdminCategoryRow) => void;
    onToggleStatus: (category: AdminCategoryRow) => void;
    onDelete: (category: AdminCategoryRow) => void;
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

const typeLabels = { BOTH: 'Both', CREDIT: 'Income', DEBIT: 'Expense' } as const;

export function CategoriesTable({
    data,
    onEdit,
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
    filters,
    activeFilterCount,
    onClearFilters,
}: Props) {
    const columns = useMemo<ColumnDef<AdminCategoryRow>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Name',
                cell: ({ row }) => (
                    <span className="flex items-center gap-2">
                        <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: row.original.color ?? '#94a3b8' }}
                        />
                        <span className="truncate">{row.original.name}</span>
                    </span>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Used for',
                cell: ({ row }) => typeLabels[row.original.type],
            },
            {
                id: 'isActive',
                header: 'Status',
                accessorFn: (row) => row.isActive,
                cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
            },
            {
                id: 'usage',
                header: 'Usage',
                enableSorting: false,
                cell: ({ row }) => {
                    const { transactions, budgets, recurringTransactions, transactionTemplates } =
                        row.original.usage;
                    return (
                        <span
                            title={`Transactions ${transactions}; budgets ${budgets}; schedules ${recurringTransactions}; templates ${transactionTemplates}`}
                        >
                            {transactions} tx · {budgets} budgets · {recurringTransactions}{' '}
                            schedules · {transactionTemplates} templates
                        </span>
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
                    const category = row.original;
                    return (
                        <div className="flex justify-end gap-1">
                            <button
                                type="button"
                                title="Edit category"
                                aria-label={`Edit ${category.name}`}
                                onClick={() => onEdit(category)}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                title={
                                    category.isActive ? 'Deactivate category' : 'Activate category'
                                }
                                aria-label={`${category.isActive ? 'Deactivate' : 'Activate'} ${category.name}`}
                                onClick={() => onToggleStatus(category)}
                                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                {category.isActive ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                title="Delete category"
                                aria-label={`Delete ${category.name}`}
                                onClick={() => onDelete(category)}
                                className="text-error hover:bg-error/10 min-h-11 min-w-11 rounded p-2 sm:min-h-0 sm:min-w-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [onEdit, onToggleStatus, onDelete],
    );

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder="Search global categories..."
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
            filters={filters}
            activeFilterCount={activeFilterCount}
            onClearFilters={onClearFilters}
        />
    );
}
