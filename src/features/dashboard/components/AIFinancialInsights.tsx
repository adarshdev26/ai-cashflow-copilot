'use client';

import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    ArrowLeftRight,
    Receipt,
    Repeat,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAiInsights } from '../hooks/use-ai-insights';
import type { FinancialInsight, InsightSeverity, InsightType } from '../types';
import { cn } from '@/lib/cn';

const TYPE_ICON: Record<InsightType, LucideIcon> = {
    SPENDING_INCREASE: TrendingUp,
    BUDGET_WARNING: AlertTriangle,
    LARGE_EXPENSE: Receipt,
    CASH_FLOW_CHANGE: ArrowLeftRight,
    RECURRING_EXPENSE: Repeat,
};

const SEVERITY_STYLES: Record<
    InsightSeverity,
    { iconWrap: string; badge: string; label: string }
> = {
    INFO: {
        iconWrap: 'bg-primary/10 text-primary',
        badge: 'bg-primary/10 text-primary',
        label: 'Info',
    },
    WARNING: {
        iconWrap: 'bg-warning/10 text-warning',
        badge: 'bg-warning/10 text-warning',
        label: 'Warning',
    },
    POSITIVE: {
        iconWrap: 'bg-success/10 text-success',
        badge: 'bg-success/10 text-success',
        label: 'Positive',
    },
};

function InsightRow({ insight }: { insight: FinancialInsight }) {
    const Icon = TYPE_ICON[insight.type] ?? Sparkles;
    const severity = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.INFO;

    return (
        <li className="flex gap-3 py-3">
            <div
                className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    severity.iconWrap,
                )}
            >
                <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base-content text-sm font-semibold">{insight.title}</p>
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                            severity.badge,
                        )}
                    >
                        {severity.label}
                    </span>
                </div>
                <p className="text-base-content/70 mt-0.5 text-sm leading-relaxed">
                    {insight.message}
                </p>
            </div>
        </li>
    );
}

function InsightsSkeleton() {
    return (
        <ul className="divide-base-300 mt-4 divide-y" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex animate-pulse gap-3 py-3">
                    <div className="bg-base-200 h-9 w-9 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="bg-base-200 h-4 w-40 rounded" />
                        <div className="bg-base-200 h-3 w-full max-w-md rounded" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function AIFinancialInsights() {
    const workspaceId = useActiveWorkspaceId();
    const { data, isLoading, isError } = useAiInsights(workspaceId);
    const insights = data?.insights ?? [];

    return (
        <section
            className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm"
            aria-labelledby="ai-financial-insights-heading"
        >
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Sparkles className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                    <h2
                        id="ai-financial-insights-heading"
                        className="text-base-content text-sm font-semibold"
                    >
                        AI Financial Insights
                    </h2>
                    <p className="text-base-content/60 text-xs">
                        Observations for this month based on your workspace activity.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <InsightsSkeleton />
            ) : isError ? (
                <p className="text-base-content/60 mt-4 text-sm">
                    Financial insights are temporarily unavailable.
                </p>
            ) : insights.length === 0 ? (
                <p className="text-base-content/60 mt-4 text-sm">
                    Not enough financial activity yet to generate insights.
                </p>
            ) : (
                <ul className="divide-base-300 mt-4 divide-y">
                    {insights.map((insight, index) => (
                        <InsightRow
                            key={`${insight.type}-${insight.title}-${index}`}
                            insight={insight}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
