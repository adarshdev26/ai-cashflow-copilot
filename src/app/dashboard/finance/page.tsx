'use client';
import { useState } from "react";
import { 
  useTransactions, 
  useCreateTransaction, 
  useUpdateTransaction,
  useDeleteTransaction,
  FinanceHeader, 
  TransactionTable, 
  TransactionModal 
} from '@/features/finance';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/features/finance/types';

type FormState = { mode: 'create' } | { mode: 'edit'; transaction: Transaction } | null;

export default function FinancePage() {
    const { data: transactions, isLoading, error } = useTransactions();
    const { mutate: addTx, isPending: isAdding } = useCreateTransaction();
    const { mutate: updateTx, isPending: isUpdating } = useUpdateTransaction();
    const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();
    
    const [formState, setFormState] = useState<FormState>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

    const isSubmitting = isAdding || isUpdating;

    const handleCreateTransaction = (data: CreateTransactionInput) => {
      addTx(data, {
        onSuccess: () => setFormState(null),
        onError: (error) => console.error('Failed to create transaction:', error)
      });
    };

    const handleUpdateTransaction = (data: UpdateTransactionInput) => {
      if (formState?.mode !== 'edit') return;
      updateTx(
        { id: formState.transaction.id, data },
        {
          onSuccess: () => setFormState(null),
          onError: (error) => console.error('Failed to update transaction:', error)
        }
      );
    };

    const handleDeleteTransaction = () => {
      if (!deleteTarget) return;
      deleteTx(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
        onError: (error) => console.error('Failed to delete transaction:', error)
      });
    };

  if (isLoading) return <div className="text-sm text-slate-500 animate-pulse p-8">Loading finance ledger...</div>;
  if (error) return <div className="text-sm text-red-600 p-8">Failed to load transactions.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <FinanceHeader onOpenModal={() => setFormState({ mode: 'create' })} />
      
      {!transactions || transactions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50">
          No transactions yet. Click "Add Transaction" to create one.
        </div>
      ) : (
        <TransactionTable 
          transactions={transactions} 
          onEdit={(tx) => setFormState({ mode: 'edit', transaction: tx })}
          onDelete={(tx) => setDeleteTarget(tx)}
        />
      )}

      {formState && (
        <TransactionModal
          key={formState.mode === 'edit' ? formState.transaction.id : 'new'}
          open={true}
          onClose={() => setFormState(null)}
          onSubmit={formState.mode === 'create' ? handleCreateTransaction : handleUpdateTransaction}
          isSubmitting={isSubmitting}
          transaction={formState.mode === 'edit' ? formState.transaction : null}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Delete transaction"
          description={`Are you sure you want to delete this transaction for ${deleteTarget.amount}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDeleteTransaction}
          onClose={() => setDeleteTarget(null)}
          loading={isDeleting}
        />
      )}
    </div>
  );

}