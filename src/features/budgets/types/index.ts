export type BudgetCategory = {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
};

export type BudgetUsage = {
  id: string;
  categoryId: string;
  category: BudgetCategory;
  period: 'MONTHLY';
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  startDate: string;
  endDate: string | null;
};

export type BudgetTotals = {
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
};

export type BudgetUsageResponse = {
  period: { from: string; to: string };
  budgets: BudgetUsage[];
  totals: BudgetTotals;
};

export type CreateBudgetInput = { categoryId: string; amount: number; startDate?: string };
export type UpdateBudgetInput = { amount: number };