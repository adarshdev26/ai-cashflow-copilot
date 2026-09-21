'use client';

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, History, Wallet } from 'lucide-react';
import { StatCard, StatCardSkeleton, StatTone } from '@/components/ui/StatCard';
import { useFinanceSummary, PeriodTotals } from '../hooks/use-finance-summary';

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
        Out <span className="font-medium text-rose-600">{currency.format(expense)}</span>
      </span>
    </div>
  );
}

const GRID = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-5';

export function FinanceStats() {
  const { data, isLoading, isError } = useFinanceSummary();

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
      <div className={GRID}>
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
    <div className={GRID}>
      <StatCard title="Total income" value={currency.format(allTime.income)} icon={ArrowUpRight} tone="positive" />
      <StatCard title="Total expense" value={currency.format(allTime.expense)} icon={ArrowDownLeft} tone="negative" />
      <StatCard title="Net balance" value={currency.format(allTime.net)} icon={Wallet} tone={netTone(allTime.net)} />
      <StatCard
        title="This month"
        caption={monthLabels.thisMonth}
        value={currency.format(thisMonth.net)}
        icon={CalendarDays}
        tone={netTone(thisMonth.net)}
        footer={<MonthBreakdown income={thisMonth.income} expense={thisMonth.expense} />}
      />
      <StatCard
        title="Last month"
        caption={monthLabels.lastMonth}
        value={currency.format(lastMonth.net)}
        icon={History}
        tone={netTone(lastMonth.net)}
        footer={<MonthBreakdown income={lastMonth.income} expense={lastMonth.expense} />}
      />
    </div>
  );
}