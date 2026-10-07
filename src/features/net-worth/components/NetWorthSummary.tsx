'use client';

import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import type { NetWorthSummary } from '../lib/net-worth';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

export function NetWorthSummaryCard({ data }: { data?: NetWorthSummary | null }) {
    if (!data) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                <div className="border-base-300 bg-base-100 h-28 animate-pulse rounded-xl border" />
                <div className="border-base-300 bg-base-100 h-28 animate-pulse rounded-xl border" />
                <div className="border-base-300 bg-base-100 h-28 animate-pulse rounded-xl border" />
            </div>
        );
    }

    const changeDirection = data.monthlyChange >= 0 ? 'up' : 'down';
    const changeText = `${data.monthlyChange >= 0 ? '+' : '-'}${currencyFormatter.format(Math.abs(data.monthlyChange))}`;
    const percentText =
        data.monthlyChangePercent == null
            ? 'No prior month'
            : `${data.monthlyChangePercent >= 0 ? '+' : ''}${data.monthlyChangePercent.toFixed(2)}%`;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
                title="Total assets"
                value={currencyFormatter.format(data.totalAssets)}
                description="Active asset accounts"
                icon={Scale}
            />
            <MetricCard
                title="Total liabilities"
                value={currencyFormatter.format(data.totalLiabilities)}
                description="Outstanding debt"
                icon={Scale}
            />
            <MetricCard
                title="Net worth"
                value={currencyFormatter.format(data.netWorth)}
                description={
                    <span className="inline-flex items-center gap-1 text-xs">
                        {changeDirection === 'up' ? (
                            <ArrowUpRight className="text-success h-3.5 w-3.5" />
                        ) : (
                            <ArrowDownRight className="text-error h-3.5 w-3.5" />
                        )}
                        {changeText} this month ({percentText})
                    </span>
                }
                icon={Scale}
            />
        </div>
    );
}
