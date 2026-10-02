'use client';

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ChartTooltip, formatINR, categoryFallbackColor } from '@/components/ui/chart';
import type { CategoryRow } from '../types';

export function CategorySpending({ rows, ariaLabel }: { rows: CategoryRow[]; ariaLabel: string }) {
  const colorOf = (r: CategoryRow, i: number) => r.color ?? categoryFallbackColor(i);

  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="mx-auto h-56 w-full max-w-xs" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="name" innerRadius="60%" outerRadius="90%" stroke="none">
              {rows.map((r, i) => (
                <Cell key={r.categoryId ?? 'none'} fill={colorOf(r, i)} />
              ))}
            </Pie>
            <ChartTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="max-h-64 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-base-content/60">
            <tr>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 text-right font-medium">Amount</th>
              <th className="py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {rows.map((r, i) => (
              <tr key={r.categoryId ?? 'none'}>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: colorOf(r, i) }}
                    />
                    <span className="truncate">{r.name}</span>
                  </span>
                </td>
                <td className="py-2 text-right">{formatINR(r.amount)}</td>
                <td className="py-2 text-right text-base-content/60">{r.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
