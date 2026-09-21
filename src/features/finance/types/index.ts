import { Category } from '@/features/categories/types';

export type TransactionType = 'CREDIT' | 'DEBIT';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  workspaceId: string;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description?: string;
  categoryId?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;