export type Category = {
    id: string;
    name: string;
    color: string | null;
    workspaceId?: string | null; // null = global
    type?: 'CREDIT' | 'DEBIT' | 'BOTH';
    isActive?: boolean;
};

export type CategorySummary = {
    categoryId: string;
    name: string;
    color: string | null;
    income: number;
    expense: number;
    net: number;
    count: number;
};

export type DateRange = { gte?: string; lt?: string };
