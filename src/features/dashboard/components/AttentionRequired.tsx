'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ChevronRight, CircleAlert, Info } from 'lucide-react';
import { formatINR } from '@/features/budgets/utils';
import { useBudgetUsage } from '@/features/budgets/hooks/use-budgets';
import { useRecurring } from '@/features/recurring/hooks/use-recurring';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import {
    AlertSeverity,
    budgetAlerts,
    currentMonthRange,
    dueSoonAlerts,
    sortAlerts,
    spendingAlert,
    spendingTrend,
    toBudgetRows,
} from '../utils/dashboard-insights';

const SEVERITY_STYLE: Record<AlertSeverity, { icon: typeof Info; box: string }> = {
    critical: { icon: CircleAlert, box: 'bg-error/10 text-error' },
    warning: { icon: AlertTriangle, box: 'bg-warning/10 text-warning' },
    info: { icon: Info, box: 'bg-info/10 text-info' },
};

export function AttentionRequired() {
    const locale = useUserLocale();
    const { from, to } = useMemo(() => currentMonthRange(), []);

    const budgets = useBudgetUsage(from, to);
    const recurring = useRecurring();
    const summary = useDashboardSummary();

    const isLoading = budgets.isLoading || recurring.isLoading || summary.isLoading;
    const hasError = budgets.isError || recurring.isError || summary.isError;

    const alerts = useMemo(() => {
        const fmt = (n: number) => formatINR(n, locale);
        const now = new Date();
        const trend = summary.data
            ? spendingTrend(summary.data.thisMonth.expense, summary.data.lastMonth.expense, now)
            : null;

        return sortAlerts([
            ...budgetAlerts(toBudgetRows(budgets.data), fmt),
            ...dueSoonAlerts(recurring.data ?? [], fmt, now),
            ...spendingAlert(trend),
        ]);
    }, [budgets.data, recurring.data, summary.data, locale]);

    return (
        <section
            aria-label="Attention required"
            className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm"
        >
            <h2 className="text-base-content text-sm font-semibold tracking-wide uppercase">
                Attention required
            </h2>

            {isLoading ? (
                <div className="mt-4 animate-pulse space-y-3" aria-busy="true">
                    <div className="bg-base-200 h-10 rounded-lg" />
                    <div className="bg-base-200 h-10 rounded-lg" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-success mt-4 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {hasError
                        ? "Nothing to show, but some checks couldn't be loaded."
                        : 'Nothing needs your attention right now.'}
                </div>
            ) : (
                <ul className="divide-base-300 mt-3 divide-y">
                    {alerts.map((alert) => {
                        const { icon: Icon, box } = SEVERITY_STYLE[alert.severity];
                        return (
                            <li key={alert.id}>
                                <Link
                                    href={alert.href}
                                    className="hover:bg-base-200/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${box}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="text-base-content block truncate text-sm font-medium">
                                            {alert.title}
                                        </span>
                                        <span className="text-base-content/60 block truncate text-xs">
                                            {alert.description}
                                        </span>
                                    </span>
                                    <ChevronRight className="text-base-content/40 h-4 w-4 shrink-0" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
