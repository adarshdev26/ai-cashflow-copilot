'use client';

import { useMemo, useCallback, memo } from 'react';
import type { ReactNode } from 'react';
import { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import {
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    Pencil,
    Trash2,
    Repeat,
    LayoutTemplate,
} from 'lucide-react';
import { Transaction } from '../types';
import { DataTable } from '@/components/ui/DataTable';
import { CategoryBadge } from '@/resources/components/CategoryBadge';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';
import { useCreateTemplate } from '@/features/transaction-templates';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { formatINR } from '@/features/budgets/utils';
import { transferAccountLabel } from '../lib/transfer-display';

interface TransactionTableProps {
    transactions?: Transaction[];
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
    pagination: PaginationState;
    sorting: SortingState;
    globalFilter: string;
    pageCount: number;
    totalCount: number;
    onPaginationChange: OnChangeFn<PaginationState>;
    onSortingChange: OnChangeFn<SortingState>;
    onGlobalFilterChange: OnChangeFn<string>;
    isLoading?: boolean;
    isFetching?: boolean;
    density?: 'comfortable' | 'compact';
    filters?: ReactNode;
    activeFilterCount?: number;
    onClearFilters?: () => void;
    activeAccountId?: string | null;
}

export const TransactionTable = memo(function TransactionTable({
    transactions = [],
    onEdit,
    onDelete,
    pagination,
    sorting,
    globalFilter,
    pageCount,
    totalCount,
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange,
    isLoading,
    isFetching,
    density = 'comfortable',
    filters,
    activeFilterCount,
    onClearFilters,
    activeAccountId,
}: TransactionTableProps) {
    const canEdit = usePermission('transaction.update');
    const canDelete = usePermission('transaction.delete');
    const canManageTemplates = usePermission('templates.manage');
    const locale = useUserLocale();
    const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateTemplate();

    const handleEdit = useCallback((tx: Transaction) => onEdit(tx), [onEdit]);
    const handleDelete = useCallback((tx: Transaction) => onDelete(tx), [onDelete]);

    const handleSaveAsTemplate = useCallback(
        (tx: Transaction) => {
            if (tx.type === 'TRANSFER') return;

            const name = window.prompt('Template name:', tx.description || 'New template');
            if (!name) return;
            createTemplate(
                {
                    name: name.trim(),
                    type: tx.type,
                    amount: tx.amount,
                    description: tx.description,
                    accountId: tx.accountId,
                    categoryId: tx.categoryId,
                    dateMode: 'TODAY',
                },
                {
                    onSuccess: () => notify.success('Template created'),
                    onError: (error) =>
                        notify.error(getErrorMessage(error, 'Failed to create template')),
                },
            );
        },
        [createTemplate],
    );

    const columns = useMemo<ColumnDef<Transaction>[]>(() => {
        const base: ColumnDef<Transaction>[] = [
            {
                accessorKey: 'description',
                header: 'Description',
                cell: ({ row }) => {
                    const tx = row.original;
                    return (
                        <div className="text-base-content flex items-center gap-3 font-medium">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                    tx.type === 'TRANSFER'
                                        ? 'bg-info/10 text-info'
                                        : tx.type === 'CREDIT'
                                          ? 'bg-success/10 text-success'
                                          : 'bg-error/10 text-error'
                                }`}
                            >
                                {tx.type === 'TRANSFER' ? (
                                    <ArrowLeftRight className="h-4 w-4" />
                                ) : tx.type === 'CREDIT' ? (
                                    <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                    <ArrowDownLeft className="h-4 w-4" />
                                )}
                            </div>
                            {tx.description || 'Untitled Transaction'}
                            {(tx.recurringTransactionId || tx.occurrenceDate) && (
                                <Repeat
                                    className="text-base-content/50 h-3.5 w-3.5 shrink-0"
                                    aria-label="Recurring"
                                />
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'account',
                header: 'Account',
                accessorFn: (row) => row.account?.name ?? '',
                cell: ({ row }) => {
                    if (row.original.type === 'TRANSFER') {
                        return (
                            <span className="text-base-content/80">
                                {transferAccountLabel(row.original, activeAccountId)}
                            </span>
                        );
                    }
                    const account = row.original.account;
                    if (!account) return <span className="text-base-content/50">None</span>;
                    return (
                        <span className="text-base-content/80">
                            {account.name}
                            {!account.isActive && (
                                <span className="text-base-content/50 ml-1 text-xs">
                                    (inactive)
                                </span>
                            )}
                        </span>
                    );
                },
            },
            {
                id: 'category',
                header: 'Category',
                accessorFn: (row) => row.category?.name ?? '',
                enableSorting: false,
                cell: ({ row }) => {
                    if (row.original.type === 'TRANSFER')
                        return <span className="text-base-content/40">—</span>;
                    return <CategoryBadge category={row.original.category} />;
                },
            },
            {
                accessorKey: 'type',
                header: 'Type',
                cell: ({ row }) => {
                    const type = row.getValue('type') as string;
                    return (
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                type === 'TRANSFER'
                                    ? 'bg-info/10 text-info'
                                    : type === 'CREDIT'
                                      ? 'bg-success/10 text-success'
                                      : 'bg-error/10 text-error'
                            }`}
                        >
                            {type}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: 'Date',
                cell: ({ row }) => (
                    <span className="text-base-content/60">
                        {new Date(row.getValue('createdAt') as string).toLocaleDateString(locale)}
                    </span>
                ),
            },
            {
                accessorKey: 'amount',
                header: 'Amount',
                cell: ({ row }) => {
                    const tx = row.original;
                    return (
                        <div
                            className={`text-right font-semibold ${
                                tx.type === 'TRANSFER'
                                    ? 'text-base-content'
                                    : tx.type === 'CREDIT'
                                      ? 'text-success'
                                      : 'text-error'
                            }`}
                        >
                            {tx.type === 'TRANSFER' ? '' : tx.type === 'CREDIT' ? '+' : '-'}
                            {formatINR(tx.amount, locale)}
                        </div>
                    );
                },
            },
        ];

        if (!canEdit && !canDelete && !canManageTemplates) return base;

        return [
            ...base,
            {
                id: 'actions',
                enableSorting: false,
                cell: ({ row }) => {
                    const tx = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            {canManageTemplates && tx.type !== 'TRANSFER' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Save as template"
                                    onClick={() => handleSaveAsTemplate(tx)}
                                    disabled={isCreatingTemplate}
                                >
                                    <LayoutTemplate className="text-primary h-4 w-4" />
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Edit transaction"
                                    onClick={() => handleEdit(tx)}
                                >
                                    <Pencil className="text-primary h-4 w-4" />
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Delete transaction"
                                    onClick={() => handleDelete(tx)}
                                >
                                    <Trash2 className="text-error h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    );
                },
            },
        ];
    }, [
        handleEdit,
        handleDelete,
        canEdit,
        canDelete,
        canManageTemplates,
        handleSaveAsTemplate,
        isCreatingTemplate,
        locale,
        activeAccountId,
    ]);

    return (
        <div data-tour="transaction-table">
            <DataTable
                columns={columns}
                data={transactions}
                searchKey="description"
                searchTourId="transaction-search"
                paginationTourId="transaction-pagination"
                actionsTourId={
                    transactions.length > 0 && (canEdit || canDelete)
                        ? 'transaction-actions'
                        : undefined
                }
                searchPlaceholder="Search transactions..."
                pageSize={pagination.pageSize}
                density={density}
                manualPagination
                manualFiltering
                manualSorting
                pageCount={pageCount}
                totalCount={totalCount}
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
        </div>
    );
});
