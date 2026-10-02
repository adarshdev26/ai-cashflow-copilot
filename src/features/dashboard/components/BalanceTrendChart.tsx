'use client';

import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBalanceTrend } from '../hooks/use-balance-trend';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { DaysRange } from '../types';
import { ChartCard } from './ChartCard';
import { RangeSelect } from './RangeSelect';
import { formatCompact, formatCurrency, formatDay } from './chart-utils';

const OPTIONS: { value: DaysRange; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
  { value: 'all', label: 'All time' },
];

export function BalanceTrendChart() {
  const workspaceId = useActiveWorkspaceId();
  const [days, setDays] = useState<DaysRange>(30);
  const { data, isLoading, isError, isFetching } = useBalanceTrend(workspaceId, days);
  const isEmpty = !!data && data.every((p) => p.balance === 0);
  const showYear = days === 'all' || days > 180;

  return (
    <ChartCard
      title="Balance trend"
      description={days === 'all' ? 'Running balance (up to the last 2 years)' : 'Running balance'}
      action={<RangeSelect label="Balance trend range" value={days} options={OPTIONS} onChange={setDays} />}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyMessage="No balance history yet."
    >
      <div className={`h-full transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`} aria-busy={isFetching}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-base-300)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDay(String(value), showYear)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-base-content)' }}
              fontSize={12}
              minTickGap={40}
            />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-base-content)' }} fontSize={12} width={56} />
            <Tooltip
              labelFormatter={(label) => formatDay(String(label), true)}
              formatter={(value) => [formatCurrency(Number(value)), 'Balance']}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#balanceFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
