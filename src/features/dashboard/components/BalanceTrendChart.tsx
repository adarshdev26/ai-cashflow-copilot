'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBalanceTrend } from '../hooks/use-balance-trend';
import { ChartCard } from './ChartCard';
import { formatCompact, formatCurrency, formatDay } from './chart-utils';

export function BalanceTrendChart() {
  const { data, isLoading, isError } = useBalanceTrend();
  const isEmpty = !!data && data.every((p) => p.balance === 0);

  return (
    <ChartCard
      title="Balance trend"
      description="Last 30 days"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyMessage="No balance history yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            minTickGap={32}
          />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} width={56} />
          <Tooltip
            labelFormatter={(label) => formatDay(String(label))}
            formatter={(value) => [formatCurrency(Number(value)), 'Balance']}
          />
          <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={2} fill="url(#balanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}