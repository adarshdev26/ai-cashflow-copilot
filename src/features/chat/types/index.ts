export type ChatRole = 'user' | 'assistant';

export type ChatTurn = {
    role: ChatRole;
    content: string;
};

export type ChatRequest = {
    message: string;
    history?: ChatTurn[];
};

export type ChatResponse = {
    reply: string;
    generatedAt: string;
};

export type ChatTransactionFact = {
    date: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string;
    category: string;
};

export type ChatBudgetFact = {
    categoryName: string;
    limit: number;
    spent: number;
    percentUsed: number;
    isOverBudget: boolean;
};

export type ChatGoalFact = {
    name: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    targetDate: string;
};

export type ChatContext = {
    currency: string;
    period: { from: string; to: string };
    totals: { income: number; expense: number; net: number; count: number };
    recentTransactions: ChatTransactionFact[];
    budgets: ChatBudgetFact[];
    goals: ChatGoalFact[];
};
