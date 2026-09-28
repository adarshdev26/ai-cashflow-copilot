'use client';

import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategorySummary } from '@/resources/hooks/use-categories';
import { ChartCard } from './ChartCard';
import { formatCurrency } from './chart-utils';

export function CategoryDonutChart() {
  const { data, isLoading, isError } = useCategorySummary({});

  // Top 5 by expense, everything else grouped as "Other"
  const slices = useMemo(() => {
    if (!data) return [];
    const sorted = data.filter((c) => c.expense > 0).sort((a, b) => b.expense - a.expense);
    const top = sorted.slice(0, 5).map((c) => ({
      name: c.name,
      value: c.expense,
      color: c.color ?? '#94a3b8',
    }));
    const rest = sorted.slice(5).reduce((sum, c) => sum + c.expense, 0);
    if (rest > 0) top.push({ name: 'Other', value: rest, color: '#cbd5e1' });
    return top;
  }, [data]);

  return (
    <ChartCard
      title="Spending by category"
      description="All time"
      isLoading={isLoading}
      isError={isError}
      isEmpty={slices.length === 0}
      emptyMessage="No expenses yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={2}>
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}