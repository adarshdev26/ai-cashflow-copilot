import { formatINR } from '@/features/budgets/utils';
import type { AccountRow } from '../types';

export function AccountBreakdown({ rows }: { rows: AccountRow[] }) {
  return (
    <div className="overflow-x-auto" data-tour="reports-account-breakdown">
      <table className="min-w-full text-sm">
        <thead className="text-left text-base-content/60">
          <tr>
            <th className="py-2 font-medium">Account</th>
            <th className="py-2 text-right font-medium">Income</th>
            <th className="py-2 text-right font-medium">Expense</th>
            <th className="py-2 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-300">
          {rows.map((r) => (
            <tr key={r.accountId ?? 'none'}>
              <td className="py-2">
                {r.name}
                {!r.isActive && (
                  <span className="badge badge-ghost badge-sm ml-2">Inactive</span>
                )}
              </td>
              <td className="py-2 text-right text-success">{formatINR(r.income)}</td>
              <td className="py-2 text-right text-error">{formatINR(r.expense)}</td>
              <td className={`py-2 text-right font-medium ${r.net < 0 ? 'text-error' : ''}`}>
                {r.net < 0 ? '-' : ''}
                {formatINR(Math.abs(r.net))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
