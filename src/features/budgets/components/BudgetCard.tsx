'use client';

import type { BudgetUsage } from '../types';
import { formatINR, usageTone } from '../utils';

type Props = {
  budget: BudgetUsage;
  canManage: boolean;
  onEdit: (b: BudgetUsage) => void;
  onDeactivate: (b: BudgetUsage) => void;
};

export function BudgetCard({ budget, canManage, onEdit, onDeactivate }: Props) {
  const tone = usageTone(budget.percentUsed);
  const width = Math.min(budget.percentUsed, 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: budget.category.color ?? '#9ca3af' }}
          />
          <div>
            <p className="font-semibold text-gray-900">{budget.category.name}</p>
            <p className="text-xs text-gray-500">
              Monthly budget{!budget.category.isActive ? ' · category inactive' : ''}
            </p>
          </div>
        </div>
        {budget.isOverBudget && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            Over budget ⚠️
          </span>
        )}
      </div>

      <p className="mt-4 text-lg font-semibold text-gray-900">
        {formatINR(budget.spent)}{' '}
        <span className="text-sm font-normal text-gray-500">/ {formatINR(budget.amount)}</span>
      </p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className={`font-medium ${tone.text}`}>{Math.round(budget.percentUsed)}% used</span>
        <span className="text-gray-500">
          {budget.remaining >= 0
            ? `${formatINR(budget.remaining)} remaining`
            : `${formatINR(Math.abs(budget.remaining))} over`}
        </span>
      </div>

      {canManage && (
        <div className="mt-4 flex gap-3 border-t border-gray-100 pt-3 text-sm">
          <button type="button" onClick={() => onEdit(budget)} className="text-gray-600 hover:text-gray-900">
            Edit
          </button>
          <button type="button" onClick={() => onDeactivate(budget)} className="text-red-600 hover:text-red-700">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}