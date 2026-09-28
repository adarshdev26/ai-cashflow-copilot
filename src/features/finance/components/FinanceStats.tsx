'use client';

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, History, Wallet } from 'lucide-react';
import { StatCard, StatCardSkeleton, StatTone } from '@/components/ui/StatCard';
import { useFinanceSummary, PeriodTotals } from '../hooks/use-finance-summary';
import { useActiveWorkspaceId } from '@/features/workspaces';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const netTone = (net: number): StatTone => (net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral');

function MonthBreakdown({ income, expense }: Pick<PeriodTotals, 'income' | 'expense'>) {
  return (
    <div className="flex items-center justify-between">
      <span>
        In <span className="font-medium text-emerald-600">{currency.format(income)}</span>
      </span>
      <span>
        Out <span className="font-medium text-red-600">{currency.format(expense)}</span>
      </span>
    </div>
  );
}

export function FinanceStats({
  totalIncome = true,
  totalExpense = true,
  netBalance = true,
  thisMonthNet = true,
  lastMonthNet = true
}) {
  const workspaceId = useActiveWorkspaceId();
  const { data, isLoading, isError } = useFinanceSummary(workspaceId);
  const visibleSections = [totalIncome, totalExpense, netBalance, thisMonthNet, lastMonthNet].filter(Boolean).length;
  const gridClass = `grid gap-4 grid-cols-1 ${visibleSections > 1 ? 'sm:grid-cols-2' : ''} ${
    visibleSections === 3 ? 'xl:grid-cols-3' : visibleSections === 4 ? 'xl:grid-cols-4' : visibleSections >= 5 ? 'xl:grid-cols-5' : ''
  }`;

  const monthLabels = useMemo(() => {
    const now = new Date();
    const format = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return {
      thisMonth: format(now),
      lastMonth: format(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    };
  }, []);

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-sm text-red-600">Couldn&apos;t load the summary.</div>;
  }

  const { allTime, thisMonth, lastMonth } = data;

  return (
    <div className={gridClass}>
      {totalIncome && (
        <StatCard title="Total income" value={currency.format(allTime.income)} icon={ArrowUpRight} tone="positive" />
      )}
      {totalExpense && (
        <StatCard title="Total expense" value={currency.format(allTime.expense)} icon={ArrowDownLeft} tone="negative" />
      )}
      {netBalance && (
        <StatCard title="Net balance" value={currency.format(allTime.net)} icon={Wallet} tone={netTone(allTime.net)} />
      )}
      {thisMonthNet && (
        <StatCard
          title="This month Net"
          caption={monthLabels.thisMonth}
          value={currency.format(thisMonth.net)}
          icon={CalendarDays}
          tone={netTone(thisMonth.net)}
          footer={<MonthBreakdown income={thisMonth.income} expense={thisMonth.expense} />}
        />
      )}
      {lastMonthNet && (
        <StatCard
          title="Last month Net"
          caption={monthLabels.lastMonth}
          value={currency.format(lastMonth.net)}
          icon={History}
          tone={netTone(lastMonth.net)}
          footer={<MonthBreakdown income={lastMonth.income} expense={lastMonth.expense} />}
        />
      )}
    </div>
  );
}