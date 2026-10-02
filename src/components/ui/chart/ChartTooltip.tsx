'use client';

import { Tooltip } from 'recharts';
import { formatINR } from './chart-formatters';

export function ChartTooltip({ formatValue = formatINR }: { formatValue?: (value: number) => string }) {
  return (
    <Tooltip
      formatter={(value) => formatValue(Number(value))}
      contentStyle={{
        background: 'var(--color-base-100)',
        border: '1px solid var(--color-base-300)',
        color: 'var(--color-base-content)',
      }}
    />
  );
}
