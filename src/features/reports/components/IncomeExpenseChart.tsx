'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip, formatCompactNumber, formatINR, formatReportBucket } from '@/components/ui/chart';
import { chartColors } from '@/components/ui/chart/chart-theme';
import type { Granularity, SeriesPoint } from '../types';

export function IncomeExpenseChart({
  data,
  granularity,
  ariaLabel,
  locale = 'en-IN',
}: {
  data: SeriesPoint[];
  granularity: Granularity;
  ariaLabel: string;
  locale?: string;
}) {
  const rows = data.map((p) => ({ ...p, name: formatReportBucket(p.key, granularity, locale) }));
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={chartColors.base300} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: chartColors.baseContent, fontSize: 12 }}
              stroke={chartColors.base300}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(value) => formatCompactNumber(Number(value), locale)}
              width={48}
              tick={{ fill: chartColors.baseContent, fontSize: 12 }}
              stroke={chartColors.base300}
            />
            <ChartTooltip locale={locale} />
            <Legend />
            <Bar dataKey="income" name="Income" fill={chartColors.income} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill={chartColors.expense} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Income</th>
              <th scope="col">Expense</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.name}</th>
                <td>{formatINR(row.income, locale)}</td>
                <td>{formatINR(row.expense, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
