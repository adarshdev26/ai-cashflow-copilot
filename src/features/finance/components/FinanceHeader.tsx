import { Plus } from 'lucide-react';

interface FinanceHeaderProps {
  onOpenModal: () => void;
}

export function FinanceHeader({ onOpenModal }: FinanceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
        <p className="text-sm text-slate-500">Track and manage your income, expenses, and cash flow items.</p>
      </div>
      <button
        onClick={onOpenModal}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Add Transaction
      </button>
    </div>
  );
}