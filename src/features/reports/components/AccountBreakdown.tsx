import { formatINR } from '@/features/budgets/utils';
import type { AccountRow } from '../types';

export function AccountBreakdown({
    rows,
    locale = 'en-IN',
}: {
    rows: AccountRow[];
    locale?: string;
}) {
    return (
        <div className="overflow-x-auto" data-tour="reports-account-breakdown">
            <table className="min-w-full text-sm">
                <thead className="text-base-content/60 text-left">
                    <tr>
                        <th className="py-2 font-medium">Account</th>
                        <th className="py-2 text-right font-medium">Income</th>
                        <th className="py-2 text-right font-medium">Expense</th>
                        <th className="py-2 text-right font-medium">Net</th>
                    </tr>
                </thead>
                <tbody className="divide-base-300 divide-y">
                    {rows.map((r) => (
                        <tr key={r.accountId ?? 'none'}>
                            <td className="py-2">
                                {r.name}
                                {!r.isActive && (
                                    <span className="badge badge-ghost badge-sm ml-2">
                                        Inactive
                                    </span>
                                )}
                            </td>
                            <td className="text-success py-2 text-right">
                                {formatINR(r.income, locale)}
                            </td>
                            <td className="text-error py-2 text-right">
                                {formatINR(r.expense, locale)}
                            </td>
                            <td
                                className={`py-2 text-right font-medium ${r.net < 0 ? 'text-error' : ''}`}
                            >
                                {r.net < 0 ? '-' : ''}
                                {formatINR(Math.abs(r.net), locale)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
