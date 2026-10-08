import { Plus, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { memo } from 'react';
import { Button, PrimaryButton } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';
import { UseTemplateMenu } from '@/features/transaction-templates/components/UseTemplateMenu';
import type { TransactionTemplateDTO } from '@/features/transaction-templates/types';
import { LockedButton, useCapability } from '@/features/plans';

type FinanceHeaderProps = {
    onOpenModal: () => void;
    onOpenExport?: () => void;
    onOpenImport?: () => void;
    onTransfer?: () => void;
    onUseTemplate?: (template: TransactionTemplateDTO) => void;
};

export const FinanceHeader = memo(function FinanceHeader({
    onOpenModal,
    onOpenExport,
    onOpenImport,
    onTransfer,
    onUseTemplate,
}: FinanceHeaderProps) {
    const canCreate = usePermission('transaction.create');
    const { allowed: canExport } = useCapability('export');
    const { allowed: canImport } = useCapability('import');
    return (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">
                    Financial Ledger
                </h1>
                <p className="text-base-content/60 text-sm">
                    Track and manage your income, expenses, and cash flow items.
                </p>
            </div>
            <div
                className="flex flex-wrap gap-2 sm:flex-nowrap"
                data-tour="transactions-import-export"
            >
                {onOpenExport && (
                    <LockedButton
                        locked={!canExport}
                        lockedMessage="Exporting transactions isn't available on your plan."
                        onClick={onOpenExport}
                        leftIcon={<Download className="h-4 w-4" />}
                        variant="secondary"
                    >
                        Export
                    </LockedButton>
                )}
                {canCreate && onOpenImport && (
                    <LockedButton
                        data-tour="transactions-import"
                        locked={!canImport}
                        lockedMessage="Importing transactions isn't available on your plan."
                        onClick={onOpenImport}
                        leftIcon={<Upload className="h-4 w-4" />}
                        variant="secondary"
                    >
                        Import
                    </LockedButton>
                )}
                {canCreate && onUseTemplate && <UseTemplateMenu onSelect={onUseTemplate} />}
                {canCreate && onTransfer && (
                    <Button
                        variant="secondary"
                        onClick={onTransfer}
                        leftIcon={<ArrowLeftRight className="h-4 w-4" />}
                    >
                        Transfer Money
                    </Button>
                )}
                {canCreate && (
                    <PrimaryButton
                        data-tour="add-transaction-btn"
                        onClick={onOpenModal}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Add Transaction
                    </PrimaryButton>
                )}
            </div>
        </div>
    );
});
