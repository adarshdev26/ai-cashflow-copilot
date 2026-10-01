'use client';

import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { BudgetUsage } from '../types';
import { formatINR, usageTone } from '../utils';

type Props = {
  budget: BudgetUsage;
  canManage: boolean;
  onEdit: (b: BudgetUsage) => void;
  onDeactivate: (b: BudgetUsage) => void;
};

const FALLBACK_COLOR = '#6366f1';

export function BudgetCard({ budget, canManage, onEdit, onDeactivate }: Props) {
  const tone = usageTone(budget.percentUsed);
  const width = Math.min(budget.percentUsed, 100);

  const color =
    budget.category.color && /^#[0-9a-fA-F]{6}$/.test(budget.category.color)
      ? budget.category.color
      : FALLBACK_COLOR;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}1A`, color }}
          >
            <PiggyBank className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{budget.category.name}</p>
            <p className="text-xs text-slate-500">
              Monthly budget{!budget.category.isActive ? ' · category inactive' : ''}
            </p>
          </div>
        </div>
        {budget.isOverBudget && (
          <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            Over budget
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-500">Spent</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {formatINR(budget.spent)}{' '}
          <span className="text-sm font-normal text-slate-400">/ {formatINR(budget.amount)}</span>
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={`font-semibold ${tone.text}`}>{Math.round(budget.percentUsed)}% used</span>
        <span className={budget.remaining < 0 ? 'font-medium text-red-600' : 'text-slate-500'}>
          {budget.remaining >= 0
            ? `${formatINR(budget.remaining)} remaining`
            : `${formatINR(Math.abs(budget.remaining))} over`}
        </span>
      </div>

      {canManage && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <Button variant="secondary" onClick={() => onEdit(budget)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => onDeactivate(budget)}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}