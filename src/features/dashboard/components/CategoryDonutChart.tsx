'use client';

import { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategorySummary } from '@/resources/hooks/use-categories';
import { DateRange } from '@/resources/types';
import { ChartCard } from './ChartCard';
import { RangeSelect } from './RangeSelect';
import { formatCurrency, toDateInput } from './chart-utils';
import { useActiveWorkspaceId } from '@/features/workspaces';

type Period = 'month' | '30d' | '90d' | 'year' | 'all';

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
];

function buildRange(period: Period): DateRange {
  const now = new Date();
  const today = toDateInput(now);
  switch (period) {
    case 'month':
      return { gte: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)), lt: today };
    case '30d':
      return { gte: toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), lt: today };
    case '90d':
      return { gte: toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)), lt: today };
    case 'year':
      return { gte: toDateInput(new Date(now.getFullYear(), 0, 1)), lt: today };
    default:
      return {};
  }
}

export function CategoryDonutChart() {
  const workspaceId = useActiveWorkspaceId();
  const [period, setPeriod] = useState<Period>('all');
  const range = useMemo(() => buildRange(period), [period]);
  const { data, isLoading, isError } = useCategorySummary(workspaceId, range);

  // Top 5 by expense, everything else grouped as "Other"
  const slices = useMemo(() => {
    if (!data) return [];
    const sorted = data.filter((c) => c.expense > 0).sort((a, b) => b.expense - a.expense);
    const top = sorted.slice(0, 5).map((c) => ({
      name: c.name,
      value: c.expense,
      color: c.color ?? 'var(--color-base-300)',
    }));
    const rest = sorted.slice(5).reduce((sum, c) => sum + c.expense, 0);
    if (rest > 0) top.push({ name: 'Other', value: rest, color: 'var(--color-base-content)' });
    return top;
  }, [data]);

  return (
    <ChartCard
      tourId="overview-category-breakdown"
      exportTourId="overview-category-png"
      title="Spending by category"
      description="Expenses"
      action={<RangeSelect label="Spending period" value={period} options={OPTIONS} onChange={setPeriod} />}
      isLoading={isLoading}
      isError={isError}
      isEmpty={slices.length === 0}
      emptyMessage="No expenses in this period."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={2}>
            {slices.map((slice, i) => (
              <Cell key={i} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
