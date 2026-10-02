'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatINR } from '@/features/budgets/utils';
import type { Granularity, SeriesPoint } from '../types';

const compact = (n: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function label(key: string, g: Granularity) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d ?? 1));
  return g === 'month'
    ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function IncomeExpenseChart({
  data,
  granularity,
}: {
  data: SeriesPoint[];
  granularity: Granularity;
}) {
  const rows = data.map((p) => ({ ...p, name: label(p.key, granularity) }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-base-300)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--color-base-content)', fontSize: 12 }}
            stroke="var(--color-base-300)"
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={compact}
            width={48}
            tick={{ fill: 'var(--color-base-content)', fontSize: 12 }}
            stroke="var(--color-base-300)"
          />
          <Tooltip
            formatter={(v) => formatINR(Number(v))}
            contentStyle={{
              background: 'var(--color-base-100)',
              border: '1px solid var(--color-base-300)',
              color: 'var(--color-base-content)',
            }}
          />
          <Legend />
          <Bar dataKey="income" name="Income" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="var(--color-error)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}