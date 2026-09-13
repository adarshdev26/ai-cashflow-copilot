import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions?: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 font-semibold text-slate-800">Recent Transactions</div>
      
      {!transactions || transactions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          No transactions found. Click &quot;Add Transaction&quot; to log your first record.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium">
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type === 'CREDIT' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    {tx.description || 'Untitled Transaction'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className={`py-4 px-6 text-right font-semibold ${
                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}