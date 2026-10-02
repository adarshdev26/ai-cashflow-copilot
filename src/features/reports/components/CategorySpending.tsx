'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '@/features/budgets/utils';
import type { CategoryRow } from '../types';

const FALLBACK = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-success)',
];

export function CategorySpending({ rows }: { rows: CategoryRow[] }) {
  const colorOf = (r: CategoryRow, i: number) => r.color ?? FALLBACK[i % FALLBACK.length];

  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="mx-auto h-56 w-full max-w-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="name" innerRadius="60%" outerRadius="90%" stroke="none">
              {rows.map((r, i) => (
                <Cell key={r.categoryId ?? 'none'} fill={colorOf(r, i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatINR(Number(v))}
              contentStyle={{
                background: 'var(--color-base-100)',
                border: '1px solid var(--color-base-300)',
                color: 'var(--color-base-content)',
              }}
            />
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