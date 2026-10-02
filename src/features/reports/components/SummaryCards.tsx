import { formatINR } from '@/features/budgets/utils';
import type { ReportSummary } from '../types';

export function SummaryCards({ summary }: { summary: ReportSummary }) {
  const net = summary.netCashFlow;
  const cards = [
    { label: 'Total Income', value: formatINR(summary.income), tone: 'text-success' },
    { label: 'Total Expenses', value: formatINR(summary.expenses), tone: 'text-error' },
    {
      label: 'Net Cash Flow',
      value: `${net < 0 ? '-' : ''}${formatINR(Math.abs(net))}`,
      tone: net < 0 ? 'text-error' : 'text-base-content',
    },
    {
      label: 'Savings Rate',
      value: `${summary.savingsRate}%`,
      tone: summary.savingsRate < 0 ? 'text-error' : 'text-base-content',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5"
        >
          <p className="text-sm text-base-content/60">{c.label}</p>
          <p className={`mt-1 truncate text-xl font-semibold sm:text-2xl ${c.tone}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-base-200" />
      ))}
    </div>
  );
}