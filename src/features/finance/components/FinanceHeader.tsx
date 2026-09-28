import { Plus } from 'lucide-react';
import { memo } from 'react';

interface FinanceHeaderProps {
  onOpenModal: () => void;
}

import { PrimaryButton } from '@/components/ui/Button'

export const FinanceHeader = memo(function FinanceHeader({ onOpenModal }: FinanceHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
        <p className="text-sm text-slate-500">Track and manage your income, expenses, and cash flow items.</p>
      </div>
      <PrimaryButton onClick={onOpenModal} leftIcon={<Plus className="h-4 w-4" />}>
        Add Transaction
      </PrimaryButton>
    </div>
  );
})