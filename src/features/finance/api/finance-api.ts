import { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../types';
import { apiFetch } from '@/lib/api-client';

export async function getTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>('/api/finance/transactions');
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