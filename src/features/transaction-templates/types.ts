import type { TransactionType } from '@/features/finance/types';

export type TemplateDateMode = 'FIXED' | 'TODAY';

export interface TransactionTemplateDTO {
    id: string;
    workspaceId: string;
    name: string;
    type: TransactionType;
    /** null = "ask each time" (user types the amount when using the template) */
    amount: number | null;
    description: string | null;
    accountId: string | null;
    account: { id: string; name: string; isActive: boolean } | null;
    categoryId: string | null;
    category: { id: string; name: string; color: string; isActive?: boolean } | null;
    dateMode: TemplateDateMode;
    /** ISO string at 12:00 UTC; only meaningful when dateMode is FIXED */
    fixedDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateInput {
    name: string;
    type: TransactionType;
    amount?: number | null;
    description?: string | null;
    accountId?: string | null;
    categoryId?: string | null;
    dateMode: TemplateDateMode;
    /** YYYY-MM-DD, required when dateMode is FIXED */
    fixedDate?: string | null;
}

export type TemplatePatch = Partial<TemplateInput>;
