import { formatINR } from '@/features/budgets/utils';
import type { BudgetRow, BudgetStatus, ReportResponse } from '../types';

const STATUS: Record<BudgetStatus, { label: string; badge: string; bar: string }> = {
  on_track: { label: 'On track', badge: 'badge-success', bar: 'progress-success' },
  warning: { label: 'Near limit', badge: 'badge-warning', bar: 'progress-warning' },
  over: { label: 'Over budget', badge: 'badge-error', bar: 'progress-error' },
};

export function BudgetPerformance({ budget }: { budget: ReportResponse['budget'] }) {
  if (!budget.available) {
    return (
      <p className="text-sm text-base-content/60">
        {budget.reason === 'income_only'
          ? 'Budget performance applies to expenses. Select Expenses or All types to see budget performance.'
          : 'Budgets are monthly. Select a single full month (for example This Month or Last Month) to see budget performance.'}
      </p>
    );
  }
  if (budget.items.length === 0) {
    return <p className="text-sm text-base-content/60">No budgets found for this period.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {budget.items.map((b) => (
        <BudgetItem key={b.categoryId} b={b} />
      ))}
    </div>
  );
}

function BudgetItem({ b }: { b: BudgetRow }) {
  const s = STATUS[b.status];
  return (
    <div className="space-y-2 rounded-lg border border-base-300 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{b.category}</span>
        <span className={`badge badge-sm ${s.badge}`}>{s.label}</span>
      </div>
      <progress
        className={`progress w-full ${s.bar}`}
        value={Math.min(b.percentUsed, 100)}
        max={100}
        aria-label={`${b.category} budget used`}
      />
      <div className="flex justify-between text-xs text-base-content/70">
        <span>
          {formatINR(b.spent)} of {formatINR(b.budget)} ({b.percentUsed}%)
        </span>
        <span className={b.remaining < 0 ? 'text-error' : ''}>
          {b.remaining < 0
            ? `${formatINR(Math.abs(b.remaining))} over`
            : `${formatINR(b.remaining)} left`}
        </span>
      </div>
    </div>
  );
}
