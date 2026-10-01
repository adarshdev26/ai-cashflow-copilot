'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify } from '@/lib/toast';
import { usePermission } from '@/features/workspaces/hooks/use-permission';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { BudgetFormModal } from '@/features/budgets/components/BudgetFormModal';
import { useBudgetUsage, useDeactivateBudget } from '@/features/budgets/hooks/use-budgets';
import type { BudgetUsage } from '@/features/budgets/types';
import { formatINR, monthLabel, monthRange } from '@/features/budgets/utils';

export default function BudgetsPage() {
  const canManage = usePermission('budgets.manage');

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const range = useMemo(() => monthRange(cursor.year, cursor.month), [cursor]);

  const { data, isLoading, isError, error } = useBudgetUsage(range.from, range.to);
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
    setEditing(null);
    setFormOpen(true);
  }

  const budgets = data?.budgets ?? [];
  const totals = data?.totals;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500">Track and control your spending.</p>
        </div>
        {canManage && <Button onClick={openCreate}>+ Create Budget</Button>}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-36 text-center text-sm font-semibold text-slate-900">
          {monthLabel(cursor.year, cursor.month)}
        </span>
        <Button variant="secondary" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {totals && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">Total budgeted</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {formatINR(totals.budgeted)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">Total spent</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {formatINR(totals.spent)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">{totals.remaining >= 0 ? 'Remaining' : 'Over by'}</p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight ${totals.remaining < 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
            >
              {formatINR(Math.abs(totals.remaining))}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-5 h-7 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load budgets'}
        </div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-900">No budgets for this month</p>
          <p className="mt-1 text-sm text-slate-500">Set a monthly limit for a spending category.</p>
          {canManage && (
            <div className="mt-4 flex justify-center">
              <Button onClick={openCreate}>+ Create Budget</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              canManage={canManage}
              onEdit={(x) => {
                setEditing(x);
                setFormOpen(true);
              }}
              onDeactivate={setRemoving}
            />
          ))}
        </div>
      )}

      <BudgetFormModal
        key={editing?.id ?? 'new'}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        periodStart={range.from}
        editing={editing}
      />

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