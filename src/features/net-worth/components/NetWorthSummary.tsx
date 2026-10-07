'use client';

import { Scale } from 'lucide-react';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import type { NetWorthSummary } from '../lib/net-worth';

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

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
                title="Total assets"
                value={new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(data.totalAssets)}
                description="Active asset accounts"
                icon={Scale}
            />
            <MetricCard
                title="Total liabilities"
                value={new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(data.totalLiabilities)}
                description="Outstanding debt"
                icon={Scale}
            />
            <MetricCard
                title="Net worth"
                value={new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(data.netWorth)}
                description="Assets minus liabilities"
                icon={Scale}
            />
        </div>
    );
}
