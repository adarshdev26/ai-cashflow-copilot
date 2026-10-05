'use client';

import { memo, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Pause, Pencil, Play, Repeat, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/features/budgets/utils';
import { getRecurringStatus, type RecurringTransactionDTO } from '../types';
import { formatScheduleDate } from './RecurringModal';
import { useUserPreferences } from '@/features/settings/hooks/use-settings';

interface RecurringTableProps {
  items?: RecurringTransactionDTO[];
  canManage: boolean;
  onEdit: (r: RecurringTransactionDTO) => void;
  onToggle: (r: RecurringTransactionDTO) => void;
  onDelete: (r: RecurringTransactionDTO) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

const FREQUENCY_LABEL = { WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' } as const;

function StatusBadge({ item }: { item: RecurringTransactionDTO }) {
  const status = getRecurringStatus(item);
  const styles = {
    ACTIVE: 'bg-success/10 text-success',
    PAUSED: 'bg-warning/10 text-warning',
    ENDED: 'bg-base-200 text-base-content/70',
  }[status];
  const label = { ACTIVE: 'Active', PAUSED: 'Paused', ENDED: 'Ended' }[status];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}
      >
        {label}
      </span>
      {item.lastError && (
        <span
          title={item.lastError}
          className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error"
        >
          <AlertTriangle className="h-3 w-3" />
          Needs attention
        </span>
      )}
    </div>
  );
}

export const RecurringTable = memo(function RecurringTable({
  items = [],
  canManage,
  onEdit,
  onToggle,
  onDelete,
  isLoading,
  isFetching,
}: RecurringTableProps) {
  const { data: preferences } = useUserPreferences();
  const locale = String(preferences?.locale ?? 'en-IN');
  const pageSize = Number(preferences?.tablePageSize ?? 10);
  const density = preferences?.tableDensity === 'compact' ? 'compact' : 'comfortable';
  const columns = useMemo<ColumnDef<RecurringTransactionDTO>[]>(() => {
    const base: ColumnDef<RecurringTransactionDTO>[] = [
      {
        id: 'description',
        header: 'Description',
        accessorFn: (row) => row.description ?? '',
        cell: ({ row }) => {
          const r = row.original;
          const isIncome = r.type === 'CREDIT';
          return (
            <div className="flex items-center gap-3 font-medium text-base-content">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isIncome ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                }`}
              >
                <Repeat className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate">{r.description || 'Untitled'}</p>
                <p className="text-xs font-normal text-base-content/50">{FREQUENCY_LABEL[r.frequency]}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const r = row.original;
          const isIncome = r.type === 'CREDIT';
          return (
            <span className={`font-semibold ${isIncome ? 'text-success' : 'text-base-content'}`}>
              {isIncome ? '+' : '-'}
              {formatINR(r.amount, locale)}
            </span>
          );
        },
      },
      {
        id: 'account',
        header: 'Account',
        accessorFn: (row) => row.account.name,
        cell: ({ row }) => <span className="text-base-content/80">{row.original.account.name}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge item={row.original} />,
      },
      {
        accessorKey: 'nextRunAt',
        header: 'Next',
        cell: ({ row }) => {
          const r = row.original;
          if (getRecurringStatus(r) === 'ENDED') return <span className="text-base-content/50">-</span>;
          return (
            <span className={r.isActive ? 'text-base-content/80' : 'text-base-content/50'}>
              {formatScheduleDate(r.nextRunAt, locale)}
            </span>
          );
        },
      },
      {
        accessorKey: 'endDate',
        header: 'Ends',
        cell: ({ row }) =>
          row.original.endDate ? (
            <span className="text-base-content/80">{formatScheduleDate(row.original.endDate, locale)}</span>
          ) : (
            <span className="text-base-content/50">No end date</span>
          ),
      },
    ];

    if (!canManage) return base;

    return [
      ...base,
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const ended = getRecurringStatus(r) === 'ENDED';
          return (
            <div className="flex items-center justify-end gap-1">
              {!ended && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={r.isActive ? 'Pause schedule' : 'Resume schedule'}
                  onClick={() => onToggle(r)}
                >
                  {r.isActive ? (
                    <Pause className="h-4 w-4 text-warning" />
                  ) : (
                    <Play className="h-4 w-4 text-success" />
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" aria-label="Edit schedule" onClick={() => onEdit(r)}>
                <Pencil className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Delete schedule" onClick={() => onDelete(r)}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [canManage, onEdit, onToggle, onDelete, locale]);

  return (
    <DataTable
      key={pageSize}
      actionsTourId={canManage ? 'recurring-actions' : undefined}
      columns={columns}
      data={items}
      searchKey="description"
      searchPlaceholder="Search recurring..."
      pageSize={pageSize}
      density={density}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
});
