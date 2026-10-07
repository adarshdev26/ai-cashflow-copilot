'use client';

import dynamic from 'next/dynamic';
import { ChartCard } from '@/features/dashboard';
import { UpcomingRecurring } from '@/features/dashboard/components/UpcomingRecurring';
import { FinancialHealth } from '@/features/dashboard/components/FinancialHealth';
import { AttentionRequired } from '@/features/dashboard/components/AttentionRequired';
import { InsightsCard } from '@/features/dashboard/components/InsightsCard';

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
    // if (isLoading) {
    //   return <div className="text-sm text-base-content/60 animate-pulse">Loading workspace analytics...</div>;
    // }

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">
                    Dashboard Overview
                </h1>
                <p className="text-base-content/60 text-sm">
                    See what needs your attention and where your money is going.
                </p>
            </div>

            <FinancialHealth />
            <AttentionRequired />

            <div className="grid items-start gap-5 lg:grid-cols-2">
                <UpcomingRecurring />
                <InsightsCard />
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
