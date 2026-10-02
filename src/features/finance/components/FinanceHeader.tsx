import { Plus, Download, Upload } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/Button';

type FinanceHeaderProps = {
  onOpenModal: () => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  onUseTemplate?: (template: TransactionTemplateDTO) => void;
};

import { PrimaryButton } from '@/components/ui/Button'
import { usePermission } from '@/features/workspaces'
import { UseTemplateMenu } from '@/features/transaction-templates/components/UseTemplateMenu';
import type { TransactionTemplateDTO } from '@/features/transaction-templates/types';

export const FinanceHeader = memo(function FinanceHeader({ onOpenModal, onOpenExport, onOpenImport, onUseTemplate }: FinanceHeaderProps) {
  const canCreate = usePermission('transaction.create');
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-base-content">Financial Ledger</h1>
        <p className="text-sm text-base-content/60">Track and manage your income, expenses, and cash flow items.</p>
      </div>
      <div className="flex items-center gap-2">
        {onOpenExport && (
          <Button variant="secondary" onClick={onOpenExport} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        )}
        {canCreate && onOpenImport && (
          <Button variant="secondary" onClick={onOpenImport} leftIcon={<Upload className="h-4 w-4" />}>
            Import
          </Button>
        )}
        {canCreate && onUseTemplate && <UseTemplateMenu onSelect={onUseTemplate} />}
        {canCreate && (
          <PrimaryButton data-tour="add-transaction-btn" onClick={onOpenModal} leftIcon={<Plus className="h-4 w-4" />}>
            Add Transaction
          </PrimaryButton>
        )}
      </div>
    </div>
  );
})