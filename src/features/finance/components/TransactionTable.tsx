'use client';

import { useMemo, useCallback, memo } from 'react';
import { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2, Repeat, LayoutTemplate } from 'lucide-react';
import { Transaction } from '../types';
import { DataTable } from '@/components/ui/DataTable';
import { CategoryBadge } from '@/resources/components/CategoryBadge';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';
import { useCreateTemplate } from '@/features/transaction-templates';
import { notify, getErrorMessage } from '@/lib/toast';

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
}: TransactionTableProps) {
  const canEdit = usePermission('transaction.update');
  const canDelete = usePermission('transaction.delete');
  const canManageTemplates = usePermission('templates.manage');
  const { mutate: createTemplate, isPending: isCreatingTemplate } = useCreateTemplate();

  const handleEdit = useCallback((tx: Transaction) => onEdit(tx), [onEdit]);
  const handleDelete = useCallback((tx: Transaction) => onDelete(tx), [onDelete]);

  const handleSaveAsTemplate = useCallback((tx: Transaction) => {
    const name = window.prompt('Template name:', tx.description || 'New template');
    if (!name) return;
    createTemplate({
      name: name.trim(),
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      dateMode: 'TODAY',
    }, {
      onSuccess: () => notify.success('Template created'),
      onError: (error) => notify.error(getErrorMessage(error, 'Failed to create template')),
    });
  }, [createTemplate]);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => {
    const base: ColumnDef<Transaction>[] = [
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="font-medium text-slate-900 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                {tx.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
              </div>
              {tx.description || 'Untitled Transaction'}
              {(tx.recurringTransactionId || tx.occurrenceDate) && (
                <Repeat className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Recurring" />
              )}
            </div>
          );
        },
      },
      {
        id: 'account',
        header: 'Account',
        enableSorting: false,
        cell: ({ row }) => {
          const account = row.original.account;
          if (!account) return <span className="text-slate-400">None</span>;
          return (
            <span className="text-slate-700">
              {account.name}
              {!account.isActive && <span className="ml-1 text-xs text-slate-400">(inactive)</span>}
            </span>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        enableSorting: false,
        cell: ({ row }) => {
          return <CategoryBadge category={row.original.category} />;
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-slate-500">
            {new Date(row.getValue('createdAt') as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className={`text-right font-semibold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-700'
              }`}>
              {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
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
              {canManageTemplates && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Save as template"
                  onClick={() => handleSaveAsTemplate(tx)}
                  disabled={isCreatingTemplate}
                >
                  <LayoutTemplate className="h-4 w-4 text-indigo-500" />
                </Button>
              )}
              {canEdit && (
                <Button variant="ghost" size="sm" aria-label="Edit transaction" onClick={() => handleEdit(tx)}>
                  <Pencil className="h-4 w-4 text-blue-500" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="sm" aria-label="Delete transaction" onClick={() => handleDelete(tx)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          );
        },
      },
    ];
  }, [handleEdit, handleDelete, canEdit, canDelete, canManageTemplates, handleSaveAsTemplate]);

  return (
    <div data-tour="transaction-table">
      <DataTable
        columns={columns}
        data={transactions}
        searchKey="description"
        searchPlaceholder="Search transactions..."
        pageSize={pagination.pageSize}
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
      />
    </div>
  );
})