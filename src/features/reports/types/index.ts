export type ReportType = 'CREDIT' | 'DEBIT';

export type ReportFilters = {
  from: string; // YYYY-MM-DD, local date
  to: string; // YYYY-MM-DD, local date, inclusive
  accountId?: string;
  categoryId?: string;
  type?: ReportType;
};

export type Granularity = 'day' | 'month';

export type ReportSummary = {
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number; // percent, 1 decimal; 0 when income is 0
  transactionCount: number;
};

export type SeriesPoint = { key: string; income: number; expense: number };

export type CategoryRow = {
  categoryId: string | null;
  name: string;
  color: string | null;
  amount: number;
  percent: number;
};

export type AccountRow = {
  accountId: string | null;
  name: string;
  currency: string | null;
  isActive: boolean;
  income: number;
  expense: number;
  net: number;
};

export type BudgetStatus = 'on_track' | 'warning' | 'over';

export type BudgetRow = {
  categoryId: string;
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
};

export type TopExpenseRow = {
  id: string;
  description: string;
  date: string; // ISO
  amount: number;
  account: string | null;
  category: string | null;
};

export type ReportResponse = {
  filters: ReportFilters;
  granularity: Granularity;
  mixedCurrency: boolean;
  summary: ReportSummary;
  series: SeriesPoint[];
  categories: CategoryRow[];
  accounts: AccountRow[];
  budget:
    | { available: true; items: BudgetRow[] }
    | { available: false; reason: 'range_not_single_month' };
  topExpenses: TopExpenseRow[];
  options: {
    accounts: { id: string; name: string }[];
    categories: { id: string; name: string }[];
  };
};