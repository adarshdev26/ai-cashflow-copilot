import { Plus, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/Button';

type FinanceHeaderProps = {
    onOpenModal: () => void;
    onOpenExport?: () => void;
    onOpenImport?: () => void;
    onTransfer?: () => void;
    onUseTemplate?: (template: TransactionTemplateDTO) => void;
};

import { PrimaryButton } from '@/components/ui/Button';
import { usePermission } from '@/features/workspaces';
import { UseTemplateMenu } from '@/features/transaction-templates/components/UseTemplateMenu';
import type { TransactionTemplateDTO } from '@/features/transaction-templates/types';
import { usePublicSettings } from '@/features/settings/hooks/use-settings';

export const FinanceHeader = memo(function FinanceHeader({
    onOpenModal,
    onOpenExport,
    onOpenImport,
    onTransfer,
    onUseTemplate,
}: FinanceHeaderProps) {
    const canCreate = usePermission('transaction.create');
    const { data: settings } = usePublicSettings();
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
                {onOpenExport && settings?.['features.csvExportEnabled'] !== false && (
                    <Button
                        variant="secondary"
                        onClick={onOpenExport}
                        leftIcon={<Download className="h-4 w-4" />}
                    >
                        Export
                    </Button>
                )}
                {canCreate && onOpenImport && settings?.['features.csvImportEnabled'] !== false && (
                    <Button
                        data-tour="transactions-import"
                        variant="secondary"
                        onClick={onOpenImport}
                        leftIcon={<Upload className="h-4 w-4" />}
                    >
                        Import
                    </Button>
                )}
                {canCreate && onUseTemplate && <UseTemplateMenu onSelect={onUseTemplate} />}
                {canCreate && onTransfer && (
                    <Button variant="secondary" onClick={onTransfer} leftIcon={<ArrowLeftRight className="h-4 w-4" />}>
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
