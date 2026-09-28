'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCashflow } from '../hooks/use-cashflow';
import { ChartCard } from './ChartCard';
import { formatCompact, formatCurrency } from './chart-utils';

const MONTH_OPTIONS = [3, 6, 12, 24];
const DEFAULT_MONTHS = 6;

export function CashflowChart() {
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const { data, isLoading, isError, isFetching } = useCashflow(months);
  const isEmpty = !!data && data.every((p) => p.income === 0 && p.expense === 0);

  const selector = (
    <select
      aria-label="Number of months to show"
      value={months}
      onChange={(event) => setMonths(Number(event.target.value))}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
    >
      {MONTH_OPTIONS.map((option) => (
        <option key={option} value={option}>
          Last {option} months
        </option>
      ))}
    </select>
  );

  return (
    <ChartCard
      title="Income vs Expense"
      description="Monthly totals"
      action={selector}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyMessage={`No transactions in the last ${months} months.`}
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