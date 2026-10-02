'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/features/workspaces';
import { useReport } from '@/features/reports/hooks/use-reports';
import { downloadReportCsv } from '@/features/reports/api/reports-api';
import { PRESETS, resolvePreset, type PresetId } from '@/features/reports/lib/report-filters';
import { ReportFilters, type FilterState } from '@/features/reports/components/ReportFilters';
import { SummaryCards, SummaryCardsSkeleton } from '@/features/reports/components/SummaryCards';
import { AccountBreakdown } from '@/features/reports/components/AccountBreakdown';
import { BudgetPerformance } from '@/features/reports/components/BudgetPerformance';
import { TopExpenses } from '@/features/reports/components/TopExpenses';
import { notify, getErrorMessage } from '@/lib/toast';
import { ChartCard, slugify } from '@/components/ui/chart';

const IncomeExpenseChart = dynamic(
  () => import('@/features/reports/components/IncomeExpenseChart').then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: () => <ChartCard title="Income vs Expense" isLoading /> }
);

const CategorySpending = dynamic(
  () => import('@/features/reports/components/CategorySpending').then((m) => m.CategorySpending),
  { ssr: false, loading: () => <ChartCard title="Spending by Category" isLoading /> }
);

const card = 'rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6';

function isYmd(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isPreset(value: string | null): value is PresetId {
  return PRESETS.some((preset) => preset.id === value);
}

function readFilters(searchParams: URLSearchParams, defaults: ReturnType<typeof resolvePreset>): FilterState {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const validRange = isYmd(from) && isYmd(to) && from <= to;
  const presetParam = searchParams.get('preset');
  const requestedPreset = isPreset(presetParam) ? presetParam : undefined;
  const presetRange = requestedPreset && requestedPreset !== 'custom'
    ? resolvePreset(requestedPreset)
    : undefined;
  const range = presetRange ?? (validRange ? { from, to } : defaults);
  const preset = requestedPreset
    ?? (range.from === defaults.from && range.to === defaults.to ? 'this_month' : 'custom');
  const id = (key: string) => {
    const value = searchParams.get(key);
    return value && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
  };
  const type = searchParams.get('type');

  return {
    ...range,
    preset,
    accountId: id('accountId'),
    categoryId: id('categoryId'),
    type: type === 'CREDIT' || type === 'DEBIT' ? type : undefined,
  };
}

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

function ReportsPageContent() {
  const { active } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const defaults = useMemo(() => resolvePreset('this_month'), []);
  const filters = useMemo(
    () => readFilters(new URLSearchParams(searchParams.toString()), defaults),
    [searchParams, defaults]
  );
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
  const { data, isLoading, isFetching, error, refetch } = useReport(apiFilters, tz, tzOffset);

  const handleChange = (next: Partial<FilterState>) => {
    let merged = { ...filters, ...next };
    if (next.preset && next.preset !== 'custom') {
      merged = { ...merged, ...resolvePreset(next.preset) };
    } else if (('from' in next || 'to' in next) && !('preset' in next)) {
      merged.preset = 'custom';
    }

    const params = new URLSearchParams(searchParams.toString());
    for (const key of ['from', 'to', 'preset', 'accountId', 'categoryId', 'type']) params.delete(key);
    if (merged.from !== defaults.from || merged.to !== defaults.to) {
      params.set('from', merged.from);
      params.set('to', merged.to);
    }
    if (merged.preset !== 'this_month') params.set('preset', merged.preset);
    if (merged.accountId) params.set('accountId', merged.accountId);
    if (merged.categoryId) params.set('categoryId', merged.categoryId);
    if (merged.type) params.set('type', merged.type);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadReportCsv(active.workspaceId, apiFilters, tz, tzOffset);
    } catch (e) {
      notify.error(getErrorMessage(e, 'Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const empty = data && data.summary.transactionCount === 0;
  const rangeFilename = `${filters.from}_to_${filters.to}`;
  const incomeExpenseLabel = `Income versus expenses by ${data?.granularity ?? 'period'}, ${filters.from} to ${filters.to}`;
  const categoryLabel = `Spending by category, ${filters.from} to ${filters.to}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
        <div className="space-y-4">
          <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
            <p className="font-medium text-error">Could not load the report</p>
            <p className="mt-1 text-sm text-base-content/70">{getErrorMessage(error, 'Try again.')}</p>
            <button type="button" onClick={() => refetch()} className="btn btn-sm btn-outline mt-3">
              Retry
            </button>
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ChartCard title="Income vs Expense" isError onRetry={() => refetch()} ariaLabel={incomeExpenseLabel} />
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Spending by Category" isError onRetry={() => refetch()} ariaLabel={categoryLabel} />
            </div>
          </div>
        </div>
      ) : isLoading || !data ? (
        <>
          <SummaryCardsSkeleton />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ChartCard title="Income vs Expense" isLoading ariaLabel={incomeExpenseLabel} />
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="Spending by Category" isLoading ariaLabel={categoryLabel} />
            </div>
          </div>
          <p className="text-center text-sm text-base-content/60">Loading report...</p>
        </>
      ) : (
        <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {error && data && (
            <div role="alert" className="alert alert-warning justify-between">
              <span>{getErrorMessage(error, 'Could not refresh the report.')}</span>
              <button type="button" onClick={() => refetch()} className="btn btn-sm btn-outline">
                Retry
              </button>
            </div>
          )}
          {data.mixedCurrency && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                Amounts in different currencies are not converted. Per-currency totals are shown
                below.
              </span>
            </div>
          )}

          <SummaryCards
            summary={data.summary}
            mixedCurrency={data.mixedCurrency}
            totalsByCurrency={data.totalsByCurrency}
          />

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
                <div className="lg:col-span-3">
                  <ChartCard
                    title="Income vs Expense"
                    ariaLabel={incomeExpenseLabel}
                    isError={!!error && !data}
                    onRetry={() => refetch()}
                    isEmpty={data.series.every((point) => point.income === 0 && point.expense === 0)}
                    emptyMessage="No income or expenses in this period."
                    filename={`${slugify(active.slug)}-${slugify('income-vs-expense')}-${rangeFilename}`}
                  >
                    <IncomeExpenseChart
                      data={data.series}
                      granularity={data.granularity}
                      ariaLabel={incomeExpenseLabel}
                    />
                  </ChartCard>
                </div>
                <div className="lg:col-span-2">
                  <ChartCard
                    title="Spending by Category"
                    ariaLabel={categoryLabel}
                    isError={!!error && !data}
                    onRetry={() => refetch()}
                    isEmpty={data.categories.length === 0}
                    emptyMessage="No spending in this period."
                    filename={`${slugify(active.slug)}-${slugify('spending-by-category')}-${rangeFilename}`}
                  >
                    <CategorySpending rows={data.categories} ariaLabel={categoryLabel} />
                  </ChartCard>
                </div>
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

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-base-200" />}>
      <ReportsPageContent />
    </Suspense>
  );
}
