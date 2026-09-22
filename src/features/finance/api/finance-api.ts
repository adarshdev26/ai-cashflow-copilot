import {
  Transaction,
  CreateTransactionInput,
  TransactionListParams,
  TransactionListResponse,
  UpdateTransactionInput,
} from '../types';
import { apiFetch } from '@/lib/api-client';

export async function getTransactions(params: TransactionListParams = {}): Promise<TransactionListResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiFetch<TransactionListResponse>(`/api/finance/transactions${query ? `?${query}` : ''}`);
}

export async function createTransaction(data: CreateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>('/api/finance/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>(`/api/finance/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/finance/transactions/${id}`, {
    method: 'DELETE',
  });
}