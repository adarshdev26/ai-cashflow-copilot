'use client';

import { useMemo, useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/features/workspaces';
import { useReport } from '@/features/reports/hooks/use-reports';
import { downloadReportCsv } from '@/features/reports/api/reports-api';
import { resolvePreset, type PresetId } from '@/features/reports/lib/report-filters';
import { ReportFilters, type FilterState } from '@/features/reports/components/ReportFilters';
import { SummaryCards, SummaryCardsSkeleton } from '@/features/reports/components/SummaryCards';
import { IncomeExpenseChart } from '@/features/reports/components/IncomeExpenseChart';
import { CategorySpending } from '@/features/reports/components/CategorySpending';
import { AccountBreakdown } from '@/features/reports/components/AccountBreakdown';
import { BudgetPerformance } from '@/features/reports/components/BudgetPerformance';
import { TopExpenses } from '@/features/reports/components/TopExpenses';
import { notify, getErrorMessage } from '@/lib/toast';

const card = 'rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6';

function Section({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${card} space-y-4 ${className}`}>
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const { active } = useWorkspace();
  const tz = useMemo(() => new Date().getTimezoneOffset(), []);
  const [filters, setFilters] = useState<FilterState>(() => ({
    preset: 'this_month',
    ...resolvePreset('this_month'),
  }));
  const [exporting, setExporting] = useState(false);

  const apiFilters = useMemo(
    () => ({
      from: filters.from,
      to: filters.to,
      accountId: filters.accountId,
      categoryId: filters.categoryId,
      type: filters.type,
    }),
    [filters.from, filters.to, filters.accountId, filters.categoryId, filters.type]
  );
  const { data, isLoading, isFetching, error, refetch } = useReport(apiFilters, tz);

  const handleChange = (next: Partial<FilterState>) => {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      if (next.preset && next.preset !== 'custom') {
        return { ...merged, ...resolvePreset(next.preset as Exclude<PresetId, 'custom'>) };
      }
      // editing dates by hand switches to custom
      if (('from' in next || 'to' in next) && !next.preset) merged.preset = 'custom';
      return merged;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadReportCsv(active.workspaceId, apiFilters, tz);
    } catch (e) {
      notify.error(getErrorMessage(e, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const empty = data && data.summary.transactionCount === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Reports</h1>
          <p className="mt-1 text-base-content/60">Analyze your income, expenses, and cash flow.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !data || !!empty}
          className="btn btn-outline btn-sm gap-1.5"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className={card}>
        <ReportFilters value={filters} onChange={handleChange} options={data?.options} />
      </div>

      {error && !data ? (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
          <p className="font-medium text-error">Could not load the report</p>
          <p className="mt-1 text-sm text-base-content/70">{getErrorMessage(error, 'Try again.')}</p>
          <button type="button" onClick={() => refetch()} className="btn btn-sm btn-outline mt-3">
            Retry
          </button>
        </div>
      ) : isLoading || !data ? (
        <>
          <SummaryCardsSkeleton />
          <div className="h-72 animate-pulse rounded-xl bg-base-200" />
          <p className="text-center text-sm text-base-content/60">Loading report...</p>
        </>
      ) : (
        <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {data.mixedCurrency && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                These results include accounts in different currencies. Totals are added without
                conversion, so filter by one account for exact figures.
              </span>
            </div>
          )}

          <SummaryCards summary={data.summary} />

          {empty ? (
            <div className={`${card} py-12 text-center`}>
              <p className="font-medium text-base-content">No financial activity found</p>
              <p className="mt-1 text-sm text-base-content/60">
                Try changing your date range or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-5">
                <Section title="Income vs Expense" className="lg:col-span-3">
                  <IncomeExpenseChart data={data.series} granularity={data.granularity} />
                </Section>
                <Section title="Spending by Category" className="lg:col-span-2">
                  {data.categories.length ? (
                    <CategorySpending rows={data.categories} />
                  ) : (
                    <p className="text-sm text-base-content/60">No spending in this period.</p>
                  )}
                </Section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Account Breakdown">
                  <AccountBreakdown rows={data.accounts} />
                </Section>
                <Section title="Top Expenses">
                  {data.topExpenses.length ? (
                    <TopExpenses rows={data.topExpenses} />
                  ) : (
                    <p className="text-sm text-base-content/60">No expenses in this period.</p>
                  )}
                </Section>
              </div>

              <Section title="Budget Performance">
                <BudgetPerformance budget={data.budget} />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}