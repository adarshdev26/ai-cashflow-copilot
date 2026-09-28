'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCashflow } from '../hooks/use-cashflow';
import { ChartCard } from './ChartCard';
import { formatCompact, formatCurrency } from './chart-utils';

export function CashflowChart() {
  const { data, isLoading, isError } = useCashflow();
  const isEmpty = !!data && data.every((p) => p.income === 0 && p.expense === 0);

  return (
    <ChartCard
      title="Income vs Expense"
      description="Last 6 months"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyMessage="No transactions in the last 6 months."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} width={56} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}