'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Wallet, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/toast';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import { BudgetTable } from '@/features/budgets/components/BudgetTable';
import { BudgetFormModal } from '@/features/budgets/components/BudgetFormModal';
import { useBudgetUsage, useDeactivateBudget } from '@/features/budgets/hooks/use-budgets';
import type { BudgetUsage } from '@/features/budgets/types';
import { formatINR, isPastMonth, monthLabel, monthRange } from '@/features/budgets/utils';

export default function BudgetsPage() {
  const canManage = usePermission('budgets.manage');

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const range = useMemo(() => monthRange(cursor.year, cursor.month), [cursor]);
  const isPast = isPastMonth(cursor.year, cursor.month);

  const { data, isLoading, isFetching, isError, error } = useBudgetUsage(range.from, range.to);
  const deactivate = useDeactivateBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetUsage | null>(null);
  const [removing, setRemoving] = useState<BudgetUsage | null>(null);

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deactivate.mutateAsync(removing.id);
      notify.success('Budget removed');
      setRemoving(null);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to remove budget');
    }
  }

  function openCreate() {
    if (isPast) return;
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(b: BudgetUsage) {
    setEditing(b);
    setFormOpen(true);
  }

  const budgets = data?.budgets ?? [];
  const totals = data?.totals;
  const showEmpty = !isLoading && !isError && budgets.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500">Track and control your spending.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} disabled={isPast}>
            + Create Budget
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-36 text-center text-sm font-semibold text-slate-900">
          {monthLabel(cursor.year, cursor.month)}
        </span>
        <Button variant="secondary" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {isPast && (
          <span className="text-xs text-slate-500">
            Past month: new budgets can only be created for the current or a future month.
          </span>
        )}
      </div>

      {totals && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total budgeted */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Total budgeted</p>
                <p className="text-xs text-slate-500">
                  {budgets.length} {budgets.length === 1 ? 'budget' : 'budgets'} this month
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">Monthly limit</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {formatINR(totals.budgeted)}
              </p>
            </div>
          </div>

          {/* Total spent */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${totals.isOverBudget ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}
                >
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Total spent</p>
                  <p className="text-xs text-slate-500">Across budgeted categories</p>
                </div>
              </div>
              {totals.isOverBudget && (
                <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  Over budget
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">Spent</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {formatINR(totals.spent)}
              </p>
            </div>

          </div>

          {/* Remaining / Over by */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${totals.remaining < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
              >
                {totals.remaining < 0 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <PiggyBank className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {totals.remaining >= 0 ? 'Remaining' : 'Over by'}
                </p>
                <p className="text-xs text-slate-500">
                  {totals.remaining >= 0 ? 'Still available to spend' : 'Above your total limit'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500">
                {totals.remaining >= 0 ? 'Left this month' : 'Overspent'}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight ${totals.remaining < 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
              >
                {formatINR(Math.abs(totals.remaining))}
              </p>
            </div>
          </div>
        </div>
      )}

      {isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load budgets'}
        </div>
      ) : showEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No budgets for this month</p>
          <p className="mt-1 text-sm text-slate-500">
            {isPast
              ? 'Budgets cannot be created for past months.'
              : 'Set a monthly limit for a spending category.'}
          </p>
          {canManage && !isPast && (
            <div className="mt-4 flex justify-center">
              <Button onClick={openCreate}>+ Create Budget</Button>
            </div>
          )}
        </div>
      ) : (
        <BudgetTable
          budgets={budgets}
          canManage={canManage}
          onEdit={openEdit}
          onDeactivate={setRemoving}
          isLoading={isLoading}
          isFetching={isFetching}
        />
      )}

      {formOpen && (
        <BudgetFormModal
          key={editing?.id ?? 'new'}
          isOpen={true}
          onClose={() => setFormOpen(false)}
          periodStart={range.from}
          editing={editing}
        />
      )}

      <ConfirmDialog
        isOpen={!!removing}
        title="Remove budget?"
        description={`Stop tracking a monthly budget for ${removing?.category.name ?? 'this category'}?`}
        confirmText="Remove"
        variant="danger"
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
        loading={deactivate.isPending}
      />
    </div>
  );
}