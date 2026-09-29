export type ValidatedTransaction = {
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string | null;
  categoryId: string | null;
};

export function validateTransactionData(data: unknown): ValidatedTransaction {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid transaction data');
  }
  const { amount, type, description, categoryId } = data as Record<string, unknown>;

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

  return {
    amount: finalAmount,
    type,
    description: finalDescription,
    categoryId: categoryId && typeof categoryId === 'string' ? categoryId : null,
  };
}
