import { formatINR } from '@/features/budgets/utils';
import type { TopExpenseRow } from '../types';

export function TopExpenses({
    rows,
    locale = 'en-IN',
}: {
    rows: TopExpenseRow[];
    locale?: string;
}) {
    return (
        <div className="overflow-x-auto" data-tour="reports-top-expenses">
            <table className="min-w-full text-sm">
                <thead className="text-base-content/60 text-left">
                    <tr>
                        <th className="py-2 font-medium">Description</th>
                        <th className="hidden py-2 font-medium sm:table-cell">Category</th>
                        <th className="hidden py-2 font-medium md:table-cell">Account</th>
                        <th className="hidden py-2 font-medium md:table-cell">Date</th>
                        <th className="py-2 text-right font-medium">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-base-300 divide-y">
                    {rows.map((r) => (
                        <tr key={r.id}>
                            <td className="max-w-[12rem] truncate py-2">
                                {r.description || '(no description)'}
                            </td>
                            <td className="hidden py-2 sm:table-cell">
                                {r.category ?? 'Uncategorized'}
                            </td>
                            <td className="hidden py-2 md:table-cell">{r.account ?? '-'}</td>
                            <td className="text-base-content/60 hidden py-2 md:table-cell">
                                {new Date(r.date).toLocaleDateString(locale, {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </td>
                            <td className="text-error py-2 text-right font-medium">
                                {formatINR(r.amount, locale)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
