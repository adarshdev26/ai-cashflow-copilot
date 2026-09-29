'use client';

import { useMemo, useCallback, memo } from 'react';
import { ColumnDef, OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { DataTable } from '@/components/ui/DataTable';
import { CategoryBadge } from '@/resources/components/CategoryBadge';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';

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
  const handleEdit = useCallback((tx: Transaction) => onEdit(tx), [onEdit]);
  const handleDelete = useCallback((tx: Transaction) => onDelete(tx), [onDelete]);

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
            </div>
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

    if (!canEdit && !canDelete) return base;

    return [
      ...base,
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
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
  }, [handleEdit, handleDelete, canEdit, canDelete]);

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