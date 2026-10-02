import { formatINR } from '@/features/budgets/utils';
import type { TopExpenseRow } from '../types';

export function TopExpenses({ rows }: { rows: TopExpenseRow[] }) {
  return (
    <div className="overflow-x-auto" data-tour="reports-top-expenses">
      <table className="min-w-full text-sm">
        <thead className="text-left text-base-content/60">
          <tr>
            <th className="py-2 font-medium">Description</th>
            <th className="hidden py-2 font-medium sm:table-cell">Category</th>
            <th className="hidden py-2 font-medium md:table-cell">Account</th>
            <th className="hidden py-2 font-medium md:table-cell">Date</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="max-w-[12rem] truncate py-2">{r.description || '(no description)'}</td>
              <td className="hidden py-2 sm:table-cell">{r.category ?? 'Uncategorized'}</td>
              <td className="hidden py-2 md:table-cell">{r.account ?? '-'}</td>
              <td className="hidden py-2 text-base-content/60 md:table-cell">
                {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </td>
              <td className="py-2 text-right font-medium text-error">{formatINR(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
