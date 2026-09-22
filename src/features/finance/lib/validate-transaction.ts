export function validateTransactionData(data: any) {
  const { amount, type, description, categoryId } = data;
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  const finalAmount = Math.round(parsedAmount * 100) / 100;

  if (type !== 'CREDIT' && type !== 'DEBIT') {
    throw new Error('Type must be CREDIT or DEBIT');
  }

  let finalDescription = null;
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
