export const ACCOUNT_TYPES = ['BANK', 'CASH', 'CREDIT_CARD', 'WALLET', 'OTHER'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_CLASSIFICATIONS = ['ASSET', 'LIABILITY'] as const;
export type AccountClassification = (typeof ACCOUNT_CLASSIFICATIONS)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    BANK: 'Bank',
    CASH: 'Cash',
    CREDIT_CARD: 'Credit Card',
    WALLET: 'Wallet',
    OTHER: 'Other',
};

export const ACCOUNT_CLASSIFICATION_LABELS: Record<AccountClassification, string> = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
};

export const DEFAULT_CLASSIFICATION_BY_TYPE: Record<AccountType, AccountClassification> = {
    BANK: 'ASSET',
    CASH: 'ASSET',
    CREDIT_CARD: 'LIABILITY',
    WALLET: 'ASSET',
    OTHER: 'ASSET',
};

export type FinancialAccount = {
    id: string;
    workspaceId: string;
    name: string;
    type: AccountType;
    classification: AccountClassification;
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
    classification?: AccountClassification;
    currency?: string;
    openingBalance?: number;
};

export type UpdateAccountInput = Partial<{
    name: string;
    type: AccountType;
    classification: AccountClassification;
    openingBalance: number;
    isActive: boolean;
}>;
