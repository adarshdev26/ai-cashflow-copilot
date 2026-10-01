'use client';

import { memo, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PiggyBank, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import type { BudgetUsage } from '../types';
import { categoryColor, formatINR, usageTone } from '../utils';

interface BudgetTableProps {
  budgets?: BudgetUsage[];
  canManage: boolean;
  onEdit: (b: BudgetUsage) => void;
  onDeactivate: (b: BudgetUsage) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

function StatusBadge({ budget }: { budget: BudgetUsage }) {
  if (budget.isOverBudget) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Over budget
      </span>
    );
  }
  if (budget.percentUsed >= 80) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        Near limit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      On track
    </span>
  );
}

export const BudgetTable = memo(function BudgetTable({
  budgets = [],
  canManage,
  onEdit,
  onDeactivate,
  isLoading,
  isFetching,
}: BudgetTableProps) {
  const columns = useMemo<ColumnDef<BudgetUsage>[]>(() => {
    const base: ColumnDef<BudgetUsage>[] = [
      {
        id: 'category',
        header: 'Category',
        accessorFn: (row) => row.category.name,
        cell: ({ row }) => {
          const b = row.original;
          const color = categoryColor(b.category.color);
          return (
            <div className="flex items-center gap-3 font-medium text-slate-900">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                <PiggyBank className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate">{b.category.name}</p>
                <p className="text-xs font-normal text-slate-400">
                  Monthly{!b.category.isActive ? ' · category inactive' : ''}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Budget',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">{formatINR(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: 'spent',
        header: 'Spent',
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">{formatINR(row.original.spent)}</span>
        ),
      },
      {
        accessorKey: 'remaining',
        header: 'Remaining',
        cell: ({ row }) => {
          const r = row.original.remaining;
          return r >= 0 ? (
            <span className="text-slate-700">{formatINR(r)}</span>
          ) : (
            <span className="font-medium text-red-600">{formatINR(Math.abs(r))} over</span>
          );
        },
      },
      {
        accessorKey: 'percentUsed',
        header: 'Usage',
        cell: ({ row }) => {
          const tone = usageTone(row.original.percentUsed);
          const width = Math.min(row.original.percentUsed, 100);
          return (
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
              </div>
              <span className={`text-xs font-semibold ${tone.text}`}>
                {Math.round(row.original.percentUsed)}%
              </span>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge budget={row.original} />,
      },
    ];

    if (!canManage) return base;

    return [
      ...base,
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="sm" aria-label="Edit budget" onClick={() => onEdit(b)}>
                <Pencil className="h-4 w-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Remove budget" onClick={() => onDeactivate(b)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [canManage, onEdit, onDeactivate]);

  return (
    <DataTable
      columns={columns}
      data={budgets}
      searchKey="category"
      searchPlaceholder="Search budgets..."
      pageSize={10}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
});