'use client';

import { memo, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, FileText, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/features/budgets/utils';
import type { TransactionTemplateDTO } from '../types';

interface TransactionTemplateTableProps {
  items?: TransactionTemplateDTO[];
  canManage: boolean;
  onEdit: (t: TransactionTemplateDTO) => void;
  onDelete: (t: TransactionTemplateDTO) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

function formatFixedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function Inactive() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-medium text-warning">
      <AlertTriangle className="h-3 w-3" />
      inactive
    </span>
  );
}

export const TransactionTemplateTable = memo(function TransactionTemplateTable({
  items = [],
  canManage,
  onEdit,
  onDelete,
  isLoading,
  isFetching,
}: TransactionTemplateTableProps) {
  const columns = useMemo<ColumnDef<TransactionTemplateDTO>[]>(() => {
    const base: ColumnDef<TransactionTemplateDTO>[] = [
      {
        accessorKey: 'name',
        header: 'Template',
        cell: ({ row }) => {
          const t = row.original;
          const isIncome = t.type === 'CREDIT';
          return (
            <div className="flex items-center gap-3 font-medium text-base-content">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isIncome ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate">{t.name}</p>
                <p className="truncate text-xs font-normal text-base-content/50">
                  {isIncome ? 'Income' : 'Expense'}
                  {t.description ? ` · ${t.description}` : ''}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const t = row.original;
          if (t.amount == null) {
            return <span className="text-base-content/50 italic">Ask each time</span>;
          }
          const isIncome = t.type === 'CREDIT';
          return (
            <span className={`font-semibold ${isIncome ? 'text-success' : 'text-base-content'}`}>
              {isIncome ? '+' : '-'}
              {formatINR(t.amount)}
            </span>
          );
        },
      },
      {
        id: 'account',
        header: 'Account',
        accessorFn: (row) => row.account?.name ?? '',
        cell: ({ row }) => {
          const a = row.original.account;
          if (!a) return <span className="text-base-content/50">-</span>;
          return (
            <span className="text-base-content/80">
              {a.name}
              {!a.isActive && <Inactive />}
            </span>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) => row.category?.name ?? '',
        cell: ({ row }) => {
          const c = row.original.category;
          if (!c) return <span className="text-base-content/50">-</span>;
          return (
            <span className="inline-flex items-center gap-2 text-base-content/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
              {c.isActive === false && <Inactive />}
            </span>
          );
        },
      },
      {
        id: 'date',
        header: 'Date',
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original;
          return t.dateMode === 'FIXED' && t.fixedDate ? (
            <span className="text-base-content/80">{formatFixedDate(t.fixedDate)}</span>
          ) : (
            <span className="text-base-content/60">Date of use</span>
          );
        },
      },
    ];

    if (!canManage) return base;

    return [
      ...base,
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" aria-label="Edit template" onClick={() => onEdit(t)}>
                <Pencil className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Delete template" onClick={() => onDelete(t)}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [canManage, onEdit, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={items}
      searchKey="name"
      searchPlaceholder="Search templates..."
      pageSize={10}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
});