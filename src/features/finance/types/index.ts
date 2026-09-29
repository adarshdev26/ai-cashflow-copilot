import { Category } from '@/resources/types';
import type { AccountType } from '@/features/accounts/types';

export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionSortBy = 'createdAt' | 'amount' | 'description' | 'type';
export type TransactionSortField = TransactionSortBy;
export type SortDirection = 'asc' | 'desc';

export interface TransactionFilters {
  [key: string]: unknown;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionAccount {
  id: string;
  name: string;
  type: AccountType;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  workspaceId: string;
  categoryId: string | null;
  category: Category | null;
  accountId: string;
  account: TransactionAccount;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionListParams extends TransactionFilters {
  page?: number;
  limit?: number;
  sortBy?: TransactionSortBy;
  sortDir?: SortDirection;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
  appliedFilters: {
    type?: TransactionType;
    categoryId?: string;
    accountId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  appliedSort: {
    sortBy: TransactionSortBy;
    sortDir: SortDirection;
  };
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description?: string;
  categoryId?: string | null;
  accountId: string;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;