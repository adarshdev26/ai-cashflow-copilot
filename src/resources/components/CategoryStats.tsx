'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import { useCategorySummary } from '../hooks/use-categories';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { CategorySummary, DateRange } from '../types';
import { formatINR } from '@/features/budgets/utils';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

function netColor(net: number) {
    if (net > 0) return 'text-success';
    if (net < 0) return 'text-error';
    return 'text-base-content';
}

function CategoryRow({ category, locale }: { category: CategorySummary; locale: string }) {
    const dotColor = category.color ?? '#94a3b8';

    return (
        <tr className="border-b border-base-200 last:border-0">
            <td className="py-2.5 pr-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                    <span className="truncate text-sm font-medium text-base-content/80">{category.name}</span>
                </div>
            </td>
            <td className="py-2.5 pr-3 text-right text-xs text-base-content/50">{category.count}</td>
            <td className="py-2.5 pr-3 text-right text-sm text-base-content/70">
                <span className="inline-flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                    {formatINR(category.income, locale)}
                </span>
            </td>
            <td className="py-2.5 pr-3 text-right text-sm text-base-content/70">
                <span className="inline-flex items-center gap-1">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-error" />
                    {formatINR(category.expense, locale)}
                </span>
            </td>
            <td className={`py-2.5 text-right text-sm font-semibold ${netColor(category.net)}`}>
                {formatINR(category.net, locale)}
            </td>
        </tr>
    );
}

function CategoryTableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-base-200" />
            ))}
        </div>
    );
}

function CategoryTable({ range }: { range?: DateRange }) {
    const workspaceId = useActiveWorkspaceId();
    const locale = useUserLocale();
    const { data, isLoading, isError } = useCategorySummary(workspaceId, range ?? {});

    if (isLoading) return <CategoryTableSkeleton />;

    if (isError || !data) {
        return <div className="text-sm text-error">Couldn&apos;t load category totals.</div>;
    }

    if (data.length === 0) {
        return <div className="text-sm text-base-content/60">No categorized transactions yet.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
                <thead>
                    <tr className="border-b border-base-300 text-xs font-medium text-base-content/50">
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3 text-right">Count</th>
                        <th className="py-2 pr-3 text-right">In</th>
                        <th className="py-2 pr-3 text-right">Out</th>
                        <th className="py-2 text-right">Net</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((category) => (
                        <CategoryRow key={category.categoryId} category={category} locale={locale} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function CategoryStatsTooltip({
    label = 'Category breakdown',
    range,
}: {
    label?: string;
    range?: DateRange;
}) {
    const [open, setOpen] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !tooltipRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div
            ref={tooltipRef}
            className="relative flex w-full items-center justify-between rounded-xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm"
        >
            <span className="text-sm font-medium text-base-content/70">{label}</span>

            <button
                type="button"
                aria-label="Show category breakdown"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpen((isOpen) => !isOpen)}
                onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setOpen(true);
                }}
                onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setOpen(false);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content/80"
            >
                <Info
                    className="h-4 w-4 rounded-full text-primary transition-all hover:h-8 hover:w-8 hover:bg-primary/10 hover:p-1"
                    strokeWidth={3}
                />
            </button>

            {open && (
                <div
                    className="fixed inset-x-4 top-1/2 z-20 max-h-[min(70dvh,32rem)] -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-400 bg-base-100 p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-12 sm:top-full sm:mt-2 sm:max-h-[min(70dvh,32rem)] sm:w-[480px] sm:max-w-[90vw] sm:-translate-y-1/2"
                    role="tooltip"
                >
                    <CategoryTable range={range} />
                </div>
            )}
        </div>
    );
}