'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import {
    ChartCard,
    MetricCard,
    MetricCardSkeleton,
    useDashboardMetrics,
} from '@/features/dashboard';
import { Activity, FileText } from 'lucide-react';
import { FinanceStats } from '@/features/finance';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { UpcomingRecurring } from '@/features/dashboard/components/UpcomingRecurring';

const CashflowChart = dynamic(
    () => import('@/features/dashboard/components/CashflowChart').then((m) => m.CashflowChart),
    { ssr: false, loading: () => <ChartCard title="Income vs Expense" isLoading /> },
);

const CategoryDonutChart = dynamic(
    () =>
        import('@/features/dashboard/components/CategoryDonutChart').then(
            (m) => m.CategoryDonutChart,
        ),
    { ssr: false, loading: () => <ChartCard title="Spending by category" isLoading /> },
);

const BalanceTrendChart = dynamic(
    () =>
        import('@/features/dashboard/components/BalanceTrendChart').then(
            (m) => m.BalanceTrendChart,
        ),
    { ssr: false, loading: () => <ChartCard title="Balance trend" isLoading /> },
);

export default function DashboardOverviewPage() {
    const workspaceId = useActiveWorkspaceId();
    const { data, isLoading, error } = useDashboardMetrics(workspaceId);

    useEffect(() => {
        if (error) {
            notify.error(getErrorMessage(error, 'Failed to load dashboard metrics'), {
                toastId: 'dashboard-metrics-error',
            });
        }
    }, [error]);

    // if (isLoading) {
    //   return <div className="text-sm text-base-content/60 animate-pulse">Loading workspace analytics...</div>;
    // }

    if (error) {
        return (
            <div className="text-error text-sm">Failed to load dashboard workspace metrics.</div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">
                    Dashboard Overview
                </h1>
                <p className="text-base-content/60 text-sm">
                    Monitor your financial health, daily habits, and active documentation.
                </p>
            </div>

            <FinanceStats totalIncome={false} totalExpense={false} />
            <UpcomingRecurring />

            <div className="grid gap-5 md:grid-cols-2">
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
