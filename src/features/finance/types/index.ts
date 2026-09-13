export type TransactionType = 'CREDIT' | 'DEBIT';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  workspaceId: string;
  createdAt: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description: string;
  workspaceId: string;
}