import type { TransactionTemplateDTO } from '../types';
import { resolveTemplateDate } from './template-date';

/**
 * Values to prefill the Add Transaction form from a template.
 * Inactive accounts/categories are dropped so the user picks a usable one.
 */
export function templateToInitialValues(t: TransactionTemplateDTO): {
  amount: number | null;
  type: 'CREDIT' | 'DEBIT';
  description: string | null;
  accountId: string | null;
  categoryId: string | null;
  date: string;
} {
  const accountUsable = !!t.account && t.account.isActive;
  const categoryUsable = !!t.category && t.category.isActive !== false;
  return {
    amount: t.amount,
    type: t.type,
    description: t.description,
    accountId: accountUsable ? t.accountId : null,
    categoryId: categoryUsable ? t.categoryId : null,
    date: resolveTemplateDate(t),
  };
}