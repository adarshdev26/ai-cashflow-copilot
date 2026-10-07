'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Banknote, Landmark, PiggyBank } from 'lucide-react';
import { StatCard, StatCardSkeleton, StatTone } from '@/components/ui/StatCard';
import { formatINR } from '@/features/budgets/utils';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useNetWorth } from '@/features/net-worth/hooks/use-net-worth';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import { cashAvailable, savingsRate } from '../utils/dashboard-insights';

const tone = (n: number): StatTone => (n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral');

function Unavailable({ label }: { label: string }) {
    return (
        <div className="border-base-300 bg-base-100 text-error flex items-center rounded-xl border p-5 text-sm">
            Couldn&apos;t load {label}.
        </div>
    );
}

export function FinancialHealth() {
    const locale = useUserLocale();
    const { workspaceId, accounts, data: summary, isLoading, isError } = useDashboardSummary();
    const netWorthQuery = useNetWorth(workspaceId);

    const fmt = useMemo(() => (n: number) => formatINR(n, locale), [locale]);

    const monthLabel = useMemo(
        () => new Date().toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
        [locale],
    );

    // Net worth = assets minus liabilities (liability balances are shown as positive amounts owed).
    const netWorth = useMemo(() => {
        const d = netWorthQuery.data;
        if (!d) return null;
        const assets = d.assets.reduce((s, a) => s + Number(a.balance), 0);
        const liabilities = d.liabilities.reduce((s, a) => s + Math.abs(Number(a.balance)), 0);
        return assets - liabilities;
    }, [netWorthQuery.data]);

    const cash = useMemo(() => (accounts ? cashAvailable(accounts) : null), [accounts]);

    const rate = summary ? savingsRate(summary.thisMonth.income, summary.thisMonth.net) : null;

    return (
        <section aria-label="Financial health" data-tour="finance-stats" className="space-y-3">
            <h2 className="text-base-content text-sm font-semibold tracking-wide uppercase">
                Financial health
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {/* Net worth (workspace-wide) */}
                {netWorthQuery.isError ? (
                    <Unavailable label="net worth" />
                ) : netWorth === null ? (
                    <StatCardSkeleton />
                ) : (
                    <Link href="/dashboard/net-worth" className="block">
                        <StatCard
                            title="Net worth"
                            caption="All accounts"
                            value={fmt(netWorth)}
                            icon={Landmark}
                            tone={tone(netWorth)}
                        />
                    </Link>
                )}

                {/* Cash available (workspace-wide) */}
                {cash === null ? (
                    <StatCardSkeleton />
                ) : (
                    <StatCard
                        title="Cash available"
                        caption="Cash, bank & wallets"
                        value={fmt(cash)}
                        icon={Banknote}
                        tone={tone(cash)}
                    />
                )}

                {/* Month figures follow the active account selection */}
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : isError || !summary ? (
                    <>
                        <Unavailable label="monthly income" />
                        <Unavailable label="monthly expenses" />
                        <Unavailable label="savings" />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Monthly income"
                            caption={monthLabel}
                            value={fmt(summary.thisMonth.income)}
                            icon={ArrowUpRight}
                            tone="positive"
                        />
                        <StatCard
                            title="Monthly expenses"
                            caption={monthLabel}
                            value={fmt(summary.thisMonth.expense)}
                            icon={ArrowDownLeft}
                            tone="negative"
                        />
                        <StatCard
                            title="Savings"
                            caption={rate === null ? 'No income yet' : `${rate}% of income`}
                            value={fmt(summary.thisMonth.net)}
                            icon={PiggyBank}
                            tone={tone(summary.thisMonth.net)}
                        />
                    </>
                )}
            </div>
        </section>
    );
}
