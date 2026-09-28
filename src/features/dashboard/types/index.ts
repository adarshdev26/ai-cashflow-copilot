export interface DashboardMetrics {
  activeHabitStreak: number;
  pendingNotesCount: number;
}

export interface CashflowPoint {
  key: string;      // '2026-09'
  label: string;    // 'Sep 26'
  income: number;
  expense: number;
}

export interface BalanceTrendPoint {
  date: string;     // '2026-09-28'
  balance: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  amount?: number;
  date: string;
  type: 'TRANSACTION' | 'HABIT' | 'NOTE';
}