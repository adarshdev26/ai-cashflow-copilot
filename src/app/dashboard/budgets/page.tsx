'use client';

import { useMemo, useState } from 'react';
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

  const budgets = data?.budgets ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500">Track and control your spending.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Create Budget
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => shiftMonth(-1)} className="rounded-lg border px-3 py-1 text-sm">
          ←
        </button>
        <span className="min-w-36 text-center font-medium">{monthLabel(cursor.year, cursor.month)}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="rounded-lg border px-3 py-1 text-sm">
          →
        </button>
      </div>

      {totals && budgets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Total budgeted</p>
            <p className="text-lg font-semibold">{formatINR(totals.budgeted)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">Total spent</p>
            <p className="text-lg font-semibold">{formatINR(totals.spent)}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{totals.remaining >= 0 ? 'Remaining' : 'Over by'}</p>
            <p className={`text-lg font-semibold ${totals.remaining < 0 ? 'text-red-600' : ''}`}>
              {formatINR(Math.abs(totals.remaining))}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load budgets'}
        </p>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium text-gray-900">No budgets for this month</p>
          <p className="mt-1 text-sm text-gray-500">Set a monthly limit for a spending category.</p>
          {canManage && (
            <Button
              className="mt-4"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              + Create Budget
            </Button>
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