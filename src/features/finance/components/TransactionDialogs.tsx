'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExportTransactionsModal } from './ExportTransactionsModal';
import { ImportTransactionsModal } from './ImportTransactionsModal';
import { ReceiptModal } from './ReceiptModal';
import { TransactionModal, type TransactionInitialValues } from './TransactionModal';
import type {
    CreateTransactionInput,
    ReceiptMetadata,
    Transaction,
    TransactionFilters,
    UpdateTransactionInput,
} from '../types';

export type TransactionFormState =
    | { mode: 'create'; initialValues?: TransactionInitialValues; templateId?: string }
    | { mode: 'edit'; transaction: Transaction }
    | null;

type Props = {
    formState: TransactionFormState;
    deleteTarget: Transaction | null;
    receiptTarget: Transaction | null;
    receipt?: ReceiptMetadata;
    exportOpen: boolean;
    importOpen: boolean;
    workspaceId: string | null;
    activeAccountId: string | null;
    activeAccountName?: string;
    filters: TransactionFilters;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    isSubmitting: boolean;
    isDeleting: boolean;
    onCloseForm: () => void;
    onCreate: (data: CreateTransactionInput, receiptFile?: File | null) => void;
    onUpdate: (data: UpdateTransactionInput) => void;
    onDelete: () => void;
    onCloseDelete: () => void;
    onCloseReceipt: () => void;
    onCloseExport: () => void;
    onCloseImport: () => void;
};

export function TransactionDialogs({
    formState,
    deleteTarget,
    receiptTarget,
    receipt,
    exportOpen,
    importOpen,
    workspaceId,
    activeAccountId,
    activeAccountName,
    filters,
    canCreate,
    canUpdate,
    canDelete,
    isSubmitting,
    isDeleting,
    onCloseForm,
    onCreate,
    onUpdate,
    onDelete,
    onCloseDelete,
    onCloseReceipt,
    onCloseExport,
    onCloseImport,
}: Props) {
    return (
        <>
            {formState && (formState.mode === 'create' ? canCreate : canUpdate) && (
                <TransactionModal
                    key={
                        formState.mode === 'edit'
                            ? formState.transaction.id
                            : `new-${formState.templateId ?? ''}`
                    }
                    open={true}
                    onClose={onCloseForm}
                    onSubmit={(values, receiptFile) => {
                        if (!formState) return;
                        if (formState.mode === 'create') onCreate(values, receiptFile);
                        else onUpdate(values);
                    }}
                    isSubmitting={isSubmitting}
                    transaction={formState.mode === 'edit' ? formState.transaction : null}
                    initialValues={
                        formState.mode === 'create' ? formState.initialValues : undefined
                    }
                />
            )}

            {deleteTarget && canDelete && (
                <ConfirmDialog
                    isOpen={true}
                    title="Delete transaction"
                    description={`Are you sure you want to delete this transaction for ${deleteTarget.amount}? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={onDelete}
                    onClose={onCloseDelete}
                    loading={isDeleting}
                />
            )}

            {receiptTarget && workspaceId && (
                <ReceiptModal
                    // Remount after an upload/replace so the note field re-seeds from the saved value.
                    key={`${receiptTarget.id}-${receipt?.updatedAt ?? 'none'}`}
                    workspaceId={workspaceId}
                    transaction={receiptTarget}
                    receipt={receipt}
                    onClose={onCloseReceipt}
                />
            )}

            {exportOpen && workspaceId && (
                <ExportTransactionsModal
                    open={true}
                    onClose={onCloseExport}
                    workspaceId={workspaceId}
                    initialFilters={{ ...filters, accountId: activeAccountId ?? filters.accountId }}
                />
            )}

            {importOpen && workspaceId && canCreate && (
                <ImportTransactionsModal
                    open={true}
                    onClose={onCloseImport}
                    workspaceId={workspaceId}
                    activeAccountId={activeAccountId}
                    activeAccountName={activeAccountName}
                />
            )}
        </>
    );
}
