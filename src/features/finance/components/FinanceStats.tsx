'use client';

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, History, Wallet } from 'lucide-react';
import { StatCard, StatCardSkeleton, StatTone } from '@/components/ui/StatCard';
import { useFinanceSummary, PeriodTotals } from '../hooks/use-finance-summary';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useAccounts, useActiveAccountId } from '@/features/accounts';

const netTone = (net: number): StatTone =>
    net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';

// MonthBreakdown needs the formatter — pass it in as a prop.
function MonthBreakdown({
    income,
    expense,
    formatCurrency,
}: Pick<PeriodTotals, 'income' | 'expense'> & {
    formatCurrency: (n: number) => string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span>
                In <span className="text-success font-medium">{formatCurrency(income)}</span>
            </span>
            <span>
                Out <span className="text-error font-medium">{formatCurrency(expense)}</span>
            </span>
        </div>
    );
}

export function FinanceStats({
    totalIncome = true,
    totalExpense = true,
    netBalance = true,
    thisMonthNet = true,
    lastMonthNet = true,
}) {
    const workspaceId = useActiveWorkspaceId();
    const [activeAccountId] = useActiveAccountId();
    const { data: accounts } = useAccounts(workspaceId, { activeOnly: true });

    // null = all accounts. If the stored account no longer exists (deleted or deactivated),
    // fall back to all accounts. While accounts are still loading, trust the stored id so we
    // don't fire an all-accounts request and then a second, filtered one.
    const accountId =
        activeAccountId && (!accounts || accounts.some((a) => a.id === activeAccountId))
            ? activeAccountId
            : null;

    const { data, isLoading, isError } = useFinanceSummary(workspaceId, accountId);

    const locale = useUserLocale();
    const currency = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }),
        [locale],
    );
    const formatCurrency = useMemo(() => (n: number) => currency.format(n), [currency]);

    const visibleSections = [
        totalIncome,
        totalExpense,
        netBalance,
        thisMonthNet,
        lastMonthNet,
    ].filter(Boolean).length;
    const gridClass = `grid gap-4 grid-cols-1 ${visibleSections > 1 ? 'sm:grid-cols-2' : ''} ${
        visibleSections === 3
            ? 'xl:grid-cols-3'
            : visibleSections === 4
              ? 'xl:grid-cols-4'
              : visibleSections >= 5
                ? 'xl:grid-cols-5'
                : ''
    }`;

    const monthLabels = useMemo(() => {
        const now = new Date();
        const format = (d: Date) =>
            d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
        return {
            thisMonth: format(now),
            lastMonth: format(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        };
    }, [locale]);

    if (isLoading) {
        return (
            <div className={gridClass} data-tour="finance-stats">
                {Array.from({ length: 5 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (isError || !data) {
        return <div className="text-error text-sm">Couldn&apos;t load the summary.</div>;
    }

    const { allTime, thisMonth, lastMonth } = data;

    return (
        <div className={gridClass} data-tour="finance-stats">
            {totalIncome && (
                <StatCard
                    title="Total income"
                    value={formatCurrency(allTime.income)}
                    icon={ArrowUpRight}
                    tone="positive"
                />
            )}
            {totalExpense && (
                <StatCard
                    title="Total expense"
                    value={formatCurrency(allTime.expense)}
                    icon={ArrowDownLeft}
                    tone="negative"
                />
            )}
            {netBalance && (
                <StatCard
                    title="Net balance"
                    value={formatCurrency(allTime.net)}
                    icon={Wallet}
                    tone={netTone(allTime.net)}
                />
            )}
            {thisMonthNet && (
                <StatCard
                    title="This month Net"
                    caption={monthLabels.thisMonth}
                    value={formatCurrency(thisMonth.net)}
                    icon={CalendarDays}
                    tone={netTone(thisMonth.net)}
                    footer={
                        <MonthBreakdown
                            income={thisMonth.income}
                            expense={thisMonth.expense}
                            formatCurrency={formatCurrency}
                        />
                    }
                />
            )}
            {lastMonthNet && (
                <StatCard
                    title="Last month Net"
                    caption={monthLabels.lastMonth}
                    value={formatCurrency(lastMonth.net)}
                    icon={History}
                    tone={netTone(lastMonth.net)}
                    footer={
                        <MonthBreakdown
                            income={lastMonth.income}
                            expense={lastMonth.expense}
                            formatCurrency={formatCurrency}
                        />
                    }
                />
            )}
        </div>
    );
}
