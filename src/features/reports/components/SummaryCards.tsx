import { formatINR } from '@/features/budgets/utils';
import { formatCurrencyAmount } from '@/components/ui/chart';
import type { ReportCurrencyTotal, ReportSummary } from '../types';

export function SummaryCards({
  summary,
  mixedCurrency = false,
  totalsByCurrency,
}: {
  summary: ReportSummary;
  mixedCurrency?: boolean;
  totalsByCurrency?: ReportCurrencyTotal[];
}) {
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
      {mixedCurrency && totalsByCurrency && totalsByCurrency.length > 0 && (
        <div className="col-span-2 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm lg:col-span-4">
          <h2 className="text-sm font-semibold text-base-content">Totals by currency</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {totalsByCurrency.map((total) => (
              <div key={total.currency ?? 'unknown'} className="rounded-lg bg-base-200/60 p-3">
                <p className="text-sm font-medium">{total.currency ?? 'Unknown currency'}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-base-content/70">
                  <dt>Income</dt>
                  <dd className="text-right">{formatCurrencyAmount(total.income, total.currency)}</dd>
                  <dt>Expenses</dt>
                  <dd className="text-right">{formatCurrencyAmount(total.expenses, total.currency)}</dd>
                  <dt>Net</dt>
                  <dd className="text-right">{formatCurrencyAmount(total.netCashFlow, total.currency)}</dd>
                  <dt>Transactions</dt>
                  <dd className="text-right">{total.transactionCount}</dd>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-tour="reports-summary">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-base-200" />
      ))}
    </div>
  );
}
