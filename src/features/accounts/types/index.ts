export const ACCOUNT_TYPES = ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'OTHER'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Bank',
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  WALLET: 'Wallet',
  OTHER: 'Other',
};

export type FinancialAccount = {
  id: string;
  workspaceId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccountWithBalance = FinancialAccount & {
  balance: number;
  transactionCount: number;
};

export type CreateAccountInput = {
  name: string;
  type: AccountType;
  currency?: string;
  openingBalance?: number;
};

export type UpdateAccountInput = Partial<{
  name: string;
  type: AccountType;
  openingBalance: number;
  isActive: boolean;
}>;