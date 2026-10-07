'use client';

import { useMemo } from 'react';
import { Lightbulb, TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';
import { formatINR } from '@/features/budgets/utils';
import { useRecurring } from '@/features/recurring/hooks/use-recurring';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import {
    cashAvailable,
    savingsRate,
    spendingTrend,
    upcomingDebitTotal,
} from '../utils/dashboard-insights';

type Insight = { id: string; icon: LucideIcon; tone: 'good' | 'warn' | 'neutral'; text: string };

const TONE_CLASS: Record<Insight['tone'], string> = {
    good: 'bg-success/10 text-success',
    warn: 'bg-warning/10 text-warning',
    neutral: 'bg-primary/10 text-primary',
};

export function InsightsCard() {
    const locale = useUserLocale();
    const { data: summary, accounts } = useDashboardSummary();
    const { data: recurring } = useRecurring();

    const insights = useMemo(() => {
        if (!summary) return [];
        const fmt = (n: number) => formatINR(n, locale);
        const now = new Date();
        const list: Insight[] = [];

        const trend = spendingTrend(summary.thisMonth.expense, summary.lastMonth.expense, now);
        if (trend) {
            list.push({
                id: 'trend',
                icon: trend.direction === 'down' ? TrendingDown : TrendingUp,
                tone: trend.direction === 'down' ? 'good' : 'warn',
                text: `At this pace, your spending will be ${trend.pct}% ${
                    trend.direction === 'down' ? 'lower' : 'higher'
                } than last month.`,
            });
        }

        const { income, net } = summary.thisMonth;
        const rate = savingsRate(income, net);
        if (rate !== null && rate >= 0) {
            list.push({
                id: 'savings',
                icon: Lightbulb,
                tone: rate >= 20 ? 'good' : 'neutral',
                text: `You're saving ${rate}% of your income this month.`,
            });
        } else if (net < 0) {
            list.push({
                id: 'overspend',
                icon: Lightbulb,
                tone: 'warn',
                text: `You've spent ${fmt(-net)} more than you earned this month.`,
            });
        }

        if (accounts && recurring) {
            const cash = cashAvailable(accounts);
            const bills = upcomingDebitTotal(recurring, 7, now);
            if (bills > 0) {
                list.push({
                    id: 'bills',
                    icon: Wallet,
                    tone: bills > cash ? 'warn' : 'neutral',
                    text:
                        bills > cash
                            ? `Bills due in the next 7 days (${fmt(bills)}) exceed your available cash (${fmt(cash)}).`
                            : `${fmt(bills)} in bills are due in the next 7 days, leaving ${fmt(cash - bills)} available.`,
                });
            }
        }

        return list.slice(0, 3);
    }, [summary, accounts, recurring, locale]);

    if (insights.length === 0) return null;

    return (
        <section
            aria-label="Insights"
            className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm"
        >
            <h2 className="text-base-content text-sm font-semibold tracking-wide uppercase">
                Insights
            </h2>
            <ul className="mt-4 space-y-3">
                {insights.map(({ id, icon: Icon, tone, text }) => (
                    <li key={id} className="flex items-start gap-3">
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}
                        >
                            <Icon className="h-4 w-4" />
                        </span>
                        <p className="text-base-content text-sm leading-relaxed">{text}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
