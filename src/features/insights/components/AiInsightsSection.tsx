'use client';

import { AlertTriangle, CheckCircle2, CircleAlert, Info, RefreshCw, Sparkles } from 'lucide-react';
import { formatINR } from '@/features/budgets/utils';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { useAiInsights, useRefreshAiInsights } from '../hooks/use-ai-insights';
import type { EvidenceItem, InsightSeverity } from '../types';

const SEVERITY_STYLE: Record<InsightSeverity, { icon: typeof Info; box: string }> = {
    critical: { icon: CircleAlert, box: 'bg-error/10 text-error' },
    warning: { icon: AlertTriangle, box: 'bg-warning/10 text-warning' },
    info: { icon: Info, box: 'bg-info/10 text-info' },
};

function formatEvidence(item: EvidenceItem, locale: string) {
    if (item.kind === 'currency') return formatINR(Number(item.value), locale);
    if (item.kind === 'percent') return `${item.value}%`;
    return String(item.value);
}

export function AiInsightsSection() {
    const workspaceId = useActiveWorkspaceId();
    const locale = useUserLocale();
    const { data, isLoading, isError, isFetching } = useAiInsights(workspaceId);
    const refresh = useRefreshAiInsights(workspaceId);

    const isRefreshing = isFetching || refresh.isPending;

    return (
        <section
            aria-label="AI financial insights"
            className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm"
        >
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base-content flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                    <Sparkles className="text-primary h-4 w-4" />
                    AI financial insights
                </h2>
                <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium">
                        AI-generated
                    </span>
                    <button
                        type="button"
                        onClick={() => refresh.mutate()}
                        disabled={isRefreshing}
                        aria-label="Refresh insights"
                        className="text-base-content/50 hover:text-base-content disabled:opacity-40"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="mt-4 animate-pulse space-y-3" aria-busy="true">
                    <div className="bg-base-200 h-14 rounded-lg" />
                    <div className="bg-base-200 h-14 rounded-lg" />
                    <div className="bg-base-200 h-14 rounded-lg" />
                </div>
            ) : isError ? (
                <div className="text-base-content/70 mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span>Couldn&apos;t generate insights right now.</span>
                    <button
                        type="button"
                        onClick={() => refresh.mutate()}
                        disabled={isRefreshing}
                        className="text-primary font-medium hover:underline disabled:opacity-40"
                    >
                        Try again
                    </button>
                </div>
            ) : !data || data.insights.length === 0 ? (
                <div className="text-base-content/60 mt-4 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="text-success h-4 w-4" />
                    Nothing notable this month yet. Insights appear as your activity grows.
                </div>
            ) : (
                <ul className="divide-base-300 mt-3 divide-y">
                    {data.insights.map((insight) => {
                        const { icon: Icon, box } = SEVERITY_STYLE[insight.severity];
                        return (
                            <li key={insight.id} className="flex items-start gap-3 py-3">
                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${box}`}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-base-content text-sm font-medium">
                                        {insight.title}
                                    </p>
                                    <p className="text-base-content/70 mt-0.5 text-sm">
                                        {insight.message}
                                    </p>
                                    <dl className="text-base-content/50 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                        {insight.evidence.map((e) => (
                                            <div key={e.label} className="flex gap-1">
                                                <dt>{e.label}:</dt>
                                                <dd className="text-base-content/80 font-medium tabular-nums">
                                                    {formatEvidence(e, locale)}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
