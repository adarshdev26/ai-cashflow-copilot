import { Transaction, CreateTransactionInput } from '../types';

export async function getTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/finance/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function createTransaction(data: CreateTransactionInput): Promise<Transaction> {
  const res = await fetch('/api/finance/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  return res.json();
}