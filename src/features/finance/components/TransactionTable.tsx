'use client';

import { useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { DataTable } from '@/components/ui/DataTable';
import { CategoryBadge } from '@/features/categories/components/CategoryBadge';
import { Button } from '@/components/ui/Button';

interface TransactionTableProps {
  transactions?: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionTable({ transactions = [], onEdit, onDelete }: TransactionTableProps) {
  const handleEdit = useCallback((tx: Transaction) => onEdit(tx), [onEdit]);
  const handleDelete = useCallback((tx: Transaction) => onDelete(tx), [onDelete]);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="font-medium text-slate-900 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
            <div className={`text-right font-semibold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-900'
              }`}>
              {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Edit transaction"
                onClick={() => handleEdit(tx)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete transaction"
                onClick={() => handleDelete(tx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={transactions}
      searchKey="description"
      searchPlaceholder="Search transactions..."
      pageSize={5}
    />
  );
}