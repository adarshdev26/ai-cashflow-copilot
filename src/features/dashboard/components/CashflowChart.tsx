'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCashflow } from '../hooks/use-cashflow';
import { MonthsRange } from '../types';
import { ChartCard } from './ChartCard';
import { RangeSelect } from './RangeSelect';
import { formatCompact, formatCurrency } from './chart-utils';

const OPTIONS: { value: MonthsRange; label: string }[] = [
  { value: 3, label: 'Last 3 months' },
  { value: 6, label: 'Last 6 months' },
  { value: 12, label: 'Last 12 months' },
  { value: 24, label: 'Last 24 months' },
  { value: 'all', label: 'All time' },
];

export function CashflowChart() {
  const [months, setMonths] = useState<MonthsRange>(6);
  const { data, isLoading, isError, isFetching } = useCashflow(months);
  const isEmpty = !!data && data.every((p) => p.income === 0 && p.expense === 0);

  return (
    <ChartCard
      title="Income vs Expense"
      description="Monthly totals"
      action={<RangeSelect label="Cashflow range" value={months} options={OPTIONS} onChange={setMonths} />}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyMessage={months === 'all' ? 'No transactions yet.' : `No transactions in the last ${months} months.`}
    >
      <div className={`h-full transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`} aria-busy={isFetching}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} minTickGap={12} />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} width={56} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}