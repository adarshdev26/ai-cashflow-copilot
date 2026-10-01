'use client';

import { useMemo, useState } from 'react';
import { Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/toast';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import { formatINR } from '@/features/budgets/utils';
import { RecurringTable } from '@/features/recurring/components/RecurringTable';
import { RecurringModal } from '@/features/recurring/components/RecurringModal';
import {
  useRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/features/recurring/hooks/use-recurring';
import { monthlyEquivalent, type RecurringTransactionDTO } from '@/features/recurring/types';

export default function RecurringPage() {
  const canManage = usePermission('recurring.manage');

  const { data, isLoading, isFetching, isError, error } = useRecurring();
  const update = useUpdateRecurring();
  const remove = useDeleteRecurring();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransactionDTO | null>(null);
  const [removing, setRemoving] = useState<RecurringTransactionDTO | null>(null);

  const items = data ?? [];
  const showEmpty = !isLoading && !isError && items.length === 0;

  const stats = useMemo(() => {
    const active = items.filter((r) => r.isActive);
    const sum = (type: 'CREDIT' | 'DEBIT') =>
      active.filter((r) => r.type === type).reduce((acc, r) => acc + monthlyEquivalent(r), 0);
    return { activeCount: active.length, income: sum('CREDIT'), expense: sum('DEBIT') };
  }, [items]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(r: RecurringTransactionDTO) {
    setEditing(r);
    setFormOpen(true);
  }

  async function toggle(r: RecurringTransactionDTO) {
    try {
      await update.mutateAsync({ id: r.id, patch: { isActive: !r.isActive } });
      notify.success(r.isActive ? 'Schedule paused' : 'Schedule resumed');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to update schedule');
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      notify.success('Schedule deleted');
      setRemoving(null);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to delete schedule');
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recurring Transactions</h1>
          <p className="text-sm text-slate-500">Manage your scheduled income and expenses.</p>
        </div>
        {canManage && <Button onClick={openCreate}>+ Add Recurring</Button>}
      </div>

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Repeat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Active schedules</p>
                <p className="text-xs text-slate-500">{items.length} in total</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{stats.activeCount}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Monthly income</p>
                <p className="text-xs text-slate-500">Average, from active schedules</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-emerald-600">
              {formatINR(stats.income)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Monthly expenses</p>
                <p className="text-xs text-slate-500">Average, from active schedules</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {formatINR(stats.expense)}
            </p>
          </div>
        </div>
      )}

      {isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load recurring transactions'}
        </div>
      ) : showEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No recurring transactions yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add rent, salary or subscriptions once and they will be recorded automatically.
          </p>
          {canManage && (
            <div className="mt-4 flex justify-center">
              <Button onClick={openCreate}>+ Add Recurring</Button>
            </div>
          )}
        </div>
      ) : (
        <RecurringTable
          items={items}
          canManage={canManage}
          onEdit={openEdit}
          onToggle={toggle}
          onDelete={setRemoving}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      )}

      {formOpen && (
        <RecurringModal
          key={editing?.id ?? 'new'}
          isOpen={true}
          onClose={() => setFormOpen(false)}
          editing={editing}
        />
      )}

      <ConfirmDialog
        isOpen={!!removing}
        title="Delete recurring transaction?"
        description={`Delete the schedule "${removing?.description || 'Untitled'}"? Transactions already created are kept.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
        loading={remove.isPending}
      />
    </div>
  );
}