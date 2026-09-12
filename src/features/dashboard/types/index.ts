export interface DashboardMetrics {
  netBalance: number;
  activeHabitStreak: number;
  pendingNotesCount: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: string;
  amount?: number;
  date: string;
  type: 'TRANSACTION' | 'HABIT' | 'NOTE';
}