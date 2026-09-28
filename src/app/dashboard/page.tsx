'use client';

<<<<<<< HEAD
import { MetricCard, MetricCardSkeleton, useDashboardMetrics } from '@/features/dashboard';
<<<<<<< HEAD
import { DollarSign, Activity, FileText } from 'lucide-react';
=======
=======
import dynamic from 'next/dynamic';
import { ChartCard, MetricCard, MetricCardSkeleton, useDashboardMetrics } from '@/features/dashboard';
>>>>>>> 584a646 (added 3 charts in dashboard)
import { Activity, FileText } from 'lucide-react';
import { FinanceStats } from '@/features/finance';
>>>>>>> c847260 (removed duplicates)

const CashflowChart = dynamic(
  () => import('@/features/dashboard/components/CashflowChart').then((m) => m.CashflowChart),
  { ssr: false, loading: () => <ChartCard title="Income vs Expense" isLoading /> }
);

const CategoryDonutChart = dynamic(
  () => import('@/features/dashboard/components/CategoryDonutChart').then((m) => m.CategoryDonutChart),
  { ssr: false, loading: () => <ChartCard title="Spending by category" isLoading /> }
);

const BalanceTrendChart = dynamic(
  () => import('@/features/dashboard/components/BalanceTrendChart').then((m) => m.BalanceTrendChart),
  { ssr: false, loading: () => <ChartCard title="Balance trend" isLoading /> }
);

export default function DashboardOverviewPage() {
  const { data, isLoading, error } = useDashboardMetrics();

  // if (isLoading) {
  //   return <div className="text-sm text-slate-500 animate-pulse">Loading workspace analytics...</div>;
  // }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load dashboard workspace metrics.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500">Monitor your financial health, daily habits, and active documentation.</p>
      </div>

<<<<<<< HEAD
      <div className="grid gap-5 md:grid-cols-3">
=======
      <FinanceStats
        totalIncome={false}
        totalExpense={false}
      />

      <div className="grid gap-5 md:grid-cols-2">
>>>>>>> c847260 (removed duplicates)
        {isLoading || !data ? (
          Array.from({ length: 2 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              title="Active Habit Streak"
              value={`${data.activeHabitStreak} Days`}
              description="Consistent execution metric"
              icon={Activity}
            />
            <MetricCard
              title="Workspace Notes"
              value={data.pendingNotesCount}
              description="Stored documents & sheets"
              icon={FileText}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashflowChart />
        </div>
        <CategoryDonutChart />
      </div>

      <BalanceTrendChart />
    </div>
  );
}