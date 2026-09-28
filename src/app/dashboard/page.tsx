'use client';

import { MetricCard, MetricCardSkeleton, useDashboardMetrics } from '@/features/dashboard';
import { DollarSign, Activity, FileText } from 'lucide-react';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

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

      <div className="grid gap-5 md:grid-cols-3">
        {isLoading || !data ? (
          Array.from({ length: 3 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              title="Net Balance"
              value={currency.format(data.netBalance)}
              description="Aggregated active transactions"
              icon={DollarSign}
            />
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
    </div>
  );
}