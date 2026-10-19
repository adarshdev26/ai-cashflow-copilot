'use client';

import { StickyNote, Clock, CheckCircle2, Wallet } from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';
import { formatCurrencyAmount } from '@/components/ui/chart/chart-formatters';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

interface NotesSummaryProps {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
    currency?: string;
    isLoading?: boolean;
}

export function NotesSummary({
    total,
    pending,
    completed,
    totalAmount,
    currency = 'INR',
    isLoading = false,
}: NotesSummaryProps) {
    const locale = useUserLocale();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    const completionRate =
        total > 0 ? `${Math.round((completed / total) * 100)}% completed` : 'No notes yet';

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total Notes"
                value={total}
                icon={StickyNote}
                tone="neutral"
                caption={completionRate}
            />
            <StatCard
                title="Pending Tasks"
                value={pending}
                icon={Clock}
                tone={pending > 0 ? 'negative' : 'positive'}
                caption={
                    pending === 1 ? '1 task requires action' : `${pending} tasks requiring action`
                }
            />
            <StatCard
                title="Completed Notes"
                value={completed}
                icon={CheckCircle2}
                tone="positive"
                caption={completed === 1 ? '1 resolved item' : `${completed} resolved items`}
            />
            <StatCard
                title="Tracked Amount"
                value={formatCurrencyAmount(totalAmount, currency, locale)}
                icon={Wallet}
                tone="neutral"
                caption="Total sum of note amounts"
            />
        </div>
    );
}
