'use client';
import { useState } from "react";
import { 
  useTransactions, 
  useCreateTransaction, 
  FinanceHeader, 
  TransactionTable, 
  TransactionModal 
} from '@/features/finance';

export default function FinancePage() {
    const { data: transactions, isLoading, error } = useTransactions();
    const { mutate: addTx, isPending } = useCreateTransaction();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateTransaction = (data: { amount: number; type: 'CREDIT' | 'DEBIT'; description: string; workspaceId: string }) => {
    addTx(data, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
        onError: (error) => {
            console.error('Failed to create transaction:', error)
        }
    });
  };

  if (isLoading) return <div className="text-sm text-slate-500 animate-pulse p-8">Loading finance ledger...</div>;
  if (error) return <div className="text-sm text-red-600 p-8">Failed to load transactions.</div>;


  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <FinanceHeader onOpenModal={() => setIsModalOpen(true)} />
      
      <TransactionTable transactions={transactions} />

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isPending={isPending}
      />
    </div>
  );

}