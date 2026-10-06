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
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { ChartCard, slugify } from '@/components/ui/chart';
import { LockedButton, PlanGate, useFeature } from '@/features/plans';
import { useUserPreferences, useWorkspaceSettings } from '@/features/settings/hooks/use-settings';

const IncomeExpenseChart = dynamic(
    () =>
        import('@/features/reports/components/IncomeExpenseChart').then(
            (m) => m.IncomeExpenseChart,
        ),
    { ssr: false, loading: () => <ChartCard title="Income vs Expense" isLoading /> },
);

const CategorySpending = dynamic(
    () => import('@/features/reports/components/CategorySpending').then((m) => m.CategorySpending),
    { ssr: false, loading: () => <ChartCard title="Spending by Category" isLoading /> },
);

const card = 'rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6';

function isYmd(value: string | null): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function isPreset(value: string | null): value is PresetId {
    return PRESETS.some((preset) => preset.id === value);
}

function readFilters(
    searchParams: URLSearchParams,
    defaults: ReturnType<typeof resolvePreset>,
    defaultPreset: Exclude<PresetId, 'custom'>,
    fiscalYearStartMonth: number,
): FilterState {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const validRange = isYmd(from) && isYmd(to) && from <= to;
    const presetParam = searchParams.get('preset');
    const requestedPreset = isPreset(presetParam) ? presetParam : undefined;
    const effectivePreset = requestedPreset ?? (validRange ? undefined : defaultPreset);
    const presetRange =
        effectivePreset && effectivePreset !== 'custom'
            ? resolvePreset(effectivePreset, new Date(), fiscalYearStartMonth)
            : undefined;
    const range = presetRange ?? (validRange ? { from, to } : defaults);
    const preset = effectivePreset ?? 'custom';
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
            <h2 className="text-base-content text-lg font-semibold">{title}</h2>
            {children}
        </section>
    );
}

function ReportsContent() {
    const { active } = useWorkspace();
    const { enabled: canExport } = useFeature('export');
    const { data: preferences } = useUserPreferences();
    const { data: workspaceSettings } = useWorkspaceSettings(active.workspaceId);
    const rawDefaultPreset = String(preferences?.defaultReportPreset ?? 'this_month');
    const defaultPreset: Exclude<PresetId, 'custom'> =
        isPreset(rawDefaultPreset) && rawDefaultPreset !== 'custom'
            ? rawDefaultPreset
            : 'this_month';
    const fiscalYearStartMonth = Number(workspaceSettings?.['finance.fiscalYearStartMonth'] ?? 1);
    const locale = String(preferences?.locale ?? 'en-IN');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
    const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
    const defaults = useMemo(
        () => resolvePreset(defaultPreset, new Date(), fiscalYearStartMonth),
        [defaultPreset, fiscalYearStartMonth],
    );
    const filters = useMemo(
        () =>
            readFilters(
                new URLSearchParams(searchParams.toString()),
                defaults,
                defaultPreset,
                fiscalYearStartMonth,
            ),
        [searchParams, defaults, defaultPreset, fiscalYearStartMonth],
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
        [filters.from, filters.to, filters.accountId, filters.categoryId, filters.type],
    );
    const { data, isLoading, isFetching, error, refetch } = useReport(apiFilters, tz, tzOffset);

    const handleChange = (next: Partial<FilterState>) => {
        let merged = { ...filters, ...next };
        if (next.preset && next.preset !== 'custom') {
            merged = { ...merged, ...resolvePreset(next.preset, new Date(), fiscalYearStartMonth) };
        } else if (('from' in next || 'to' in next) && !('preset' in next)) {
            merged.preset = 'custom';
        }

        const params = new URLSearchParams(searchParams.toString());
        for (const key of ['from', 'to', 'preset', 'accountId', 'categoryId', 'type'])
            params.delete(key);
        if (merged.from !== defaults.from || merged.to !== defaults.to) {
            params.set('from', merged.from);
            params.set('to', merged.to);
        }
        if (merged.preset !== defaultPreset) params.set('preset', merged.preset);
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
                    <h1 className="text-base-content text-2xl font-bold">Reports</h1>
                    <p className="text-base-content/60 mt-1">
                        Analyze your income, expenses, and cash flow.
                    </p>
                </div>

              <LockedButton
                    data-tour={isLoading || !data || empty ? undefined : 'reports-export'}
                    locked={!canExport}
                    lockedMessage="Exporting reports isn't available on your plan."
                    onClick={handleExport}
                    leftIcon={<Download className="h-4 w-4" />}
                    loading={exporting}
                    disabled={isLoading || !data || empty}
                >
                    Export CSV
                </LockedButton>
            </div>

            <div className={card} data-tour="reports-filters">
                <ReportFilters value={filters} onChange={handleChange} options={data?.options} />
            </div>

            {error && !data ? (
                <div className="space-y-4">
                    <div
                        role="alert"
                        className="border-error/30 bg-error/10 rounded-xl border p-6 text-center"
                    >
                        <p className="text-error font-medium">Could not load the report</p>
                        <p className="text-base-content/70 mt-1 text-sm">
                            {getErrorMessage(error, 'Try again.')}
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="btn btn-sm btn-outline mt-3"
                        >
                            Retry
                        </button>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3" data-tour="reports-income-expense">
                            <ChartCard
                                title="Income vs Expense"
                                isError
                                onRetry={() => refetch()}
                                ariaLabel={incomeExpenseLabel}
                            />
                        </div>
                        <div className="lg:col-span-2" data-tour="reports-category-chart">
                            <ChartCard
                                title="Spending by Category"
                                isError
                                onRetry={() => refetch()}
                                ariaLabel={categoryLabel}
                            />
                        </div>
                    </div>
                </div>
            ) : isLoading || !data ? (
                <>
                    <SummaryCardsSkeleton />
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3" data-tour="reports-income-expense">
                            <ChartCard
                                title="Income vs Expense"
                                isLoading
                                ariaLabel={incomeExpenseLabel}
                            />
                        </div>
                        <div className="lg:col-span-2" data-tour="reports-category-chart">
                            <ChartCard
                                title="Spending by Category"
                                isLoading
                                ariaLabel={categoryLabel}
                            />
                        </div>
                    </div>
                    <p className="text-base-content/60 text-center text-sm">Loading report...</p>
                </>
            ) : (
                <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                    {error && data && (
                        <div role="alert" className="alert alert-warning justify-between">
                            <span>{getErrorMessage(error, 'Could not refresh the report.')}</span>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="btn btn-sm btn-outline"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {data.mixedCurrency && (
                        <div
                            role="alert"
                            className="border-warning/40 bg-warning/10 flex items-start gap-2 rounded-lg border p-3 text-sm"
                        >
                            <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                Amounts in different currencies are not converted. Per-currency
                                totals are shown below.
                            </span>
                        </div>
                    )}

                    <div data-tour="reports-summary">
                        <SummaryCards
                            summary={data.summary}
                            mixedCurrency={data.mixedCurrency}
                            totalsByCurrency={data.totalsByCurrency}
                            locale={locale}
                        />
                    </div>

                    {empty ? (
                        <div className={`${card} py-12 text-center`}>
                            <p className="text-base-content font-medium">
                                No financial activity found
                            </p>
                            <p className="text-base-content/60 mt-1 text-sm">
                                Try changing your date range or filters.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-6 lg:grid-cols-5">
                                <div className="lg:col-span-3" data-tour="reports-income-expense">
                                    <ChartCard
                                        title="Income vs Expense"
                                        ariaLabel={incomeExpenseLabel}
                                        isError={!!error && !data}
                                        onRetry={() => refetch()}
                                        isEmpty={data.series.every(
                                            (point) => point.income === 0 && point.expense === 0,
                                        )}
                                        emptyMessage="No income or expenses in this period."
                                        filename={`${slugify(active.slug)}-${slugify('income-vs-expense')}-${rangeFilename}`}
                                        exportTourId="reports-income-png"
                                    >
                                        <IncomeExpenseChart
                                            data={data.series}
                                            granularity={data.granularity}
                                            ariaLabel={incomeExpenseLabel}
                                            locale={locale}
                                        />
                                    </ChartCard>
                                </div>
                                <div className="lg:col-span-2" data-tour="reports-category-chart">
                                    <ChartCard
                                        title="Spending by Category"
                                        ariaLabel={categoryLabel}
                                        isError={!!error && !data}
                                        onRetry={() => refetch()}
                                        isEmpty={data.categories.length === 0}
                                        emptyMessage="No spending in this period."
                                        filename={`${slugify(active.slug)}-${slugify('spending-by-category')}-${rangeFilename}`}
                                        exportTourId="reports-category-png"
                                    >
                                        <CategorySpending
                                            rows={data.categories}
                                            ariaLabel={categoryLabel}
                                            locale={locale}
                                        />
                                    </ChartCard>
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <Section title="Account Breakdown">
                                    <AccountBreakdown rows={data.accounts} locale={locale} />
                                </Section>
                                <Section title="Top Expenses">
                                    {data.topExpenses.length ? (
                                        <TopExpenses rows={data.topExpenses} locale={locale} />
                                    ) : (
                                        <p className="text-base-content/60 text-sm">
                                            No expenses in this period.
                                        </p>
                                    )}
                                </Section>
                            </div>

                            <div data-tour="reports-budget-performance">
                                <Section title="Budget Performance">
                                    <BudgetPerformance budget={data.budget} locale={locale} />
                                </Section>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    return (
        <PlanGate feature="reports">
            <Suspense fallback={<div className="bg-base-200 h-72 animate-pulse rounded-xl" />}>
                <ReportsContent />
            </Suspense>
        </PlanGate>
    );
}
