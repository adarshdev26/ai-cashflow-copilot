import { toScheduleDate } from '@/lib/recurring/recurring-dates';

export type ValidatedTransaction = {
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string | null;
  categoryId: string | null;
  accountId: string;
  date: Date | null;
};

/** Optional YYYY-MM-DD from the client. Stored at 12:00 UTC (same convention as recurring). */
function parseTransactionDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  try {
    return toScheduleDate(value);
  } catch {
    throw new Error('Invalid date');
  }
}

export function validateTransactionData(data: unknown): ValidatedTransaction {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid transaction data');
  }
  const { amount, type, description, categoryId, accountId, date } = data as Record<string, unknown>;

  const parsedAmount = parseFloat(String(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  const finalAmount = Math.round(parsedAmount * 100) / 100;

  if (type !== 'CREDIT' && type !== 'DEBIT') {
    throw new Error('Type must be CREDIT or DEBIT');
  }

  let finalDescription: string | null = null;
  if (description && typeof description === 'string') {
    finalDescription = description.trim();
    if (finalDescription.length > 255) {
      throw new Error('Description must be at most 255 characters');
    }
  }

  if (accountId !== undefined && accountId !== null && accountId !== '' && typeof accountId !== 'string') {
    throw new Error('Invalid account');
  }

  if (typeof accountId !== 'string' || accountId.trim() === '') {
    throw new Error('Account is required');
  }

  return {
    amount: finalAmount,
    type,
    description: finalDescription,
    categoryId: categoryId && typeof categoryId === 'string' ? categoryId : null,
    accountId: accountId.trim(),
    date: parseTransactionDate(date),
  };
}
