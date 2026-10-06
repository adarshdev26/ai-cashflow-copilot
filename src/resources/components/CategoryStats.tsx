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
        <tr className="border-base-200 border-b last:border-0">
            <td className="py-2.5 pr-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                    />
                    <span className="text-base-content/80 truncate text-sm font-medium">
                        {category.name}
                    </span>
                </div>
            </td>
            <td className="text-base-content/50 py-2.5 pr-3 text-right text-xs">
                {category.count}
            </td>
            <td className="text-base-content/70 py-2.5 pr-3 text-right text-sm">
                <span className="inline-flex items-center gap-1">
                    <ArrowUpRight className="text-success h-3.5 w-3.5" />
                    {formatINR(category.income, locale)}
                </span>
            </td>
            <td className="text-base-content/70 py-2.5 pr-3 text-right text-sm">
                <span className="inline-flex items-center gap-1">
                    <ArrowDownLeft className="text-error h-3.5 w-3.5" />
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
                <div key={i} className="bg-base-200 h-9 animate-pulse rounded-md" />
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
        return <div className="text-error text-sm">Couldn&apos;t load category totals.</div>;
    }

    if (data.length === 0) {
        return <div className="text-base-content/60 text-sm">No categorized transactions yet.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
                <thead>
                    <tr className="border-base-300 text-base-content/50 border-b text-xs font-medium">
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3 text-right">Count</th>
                        <th className="py-2 pr-3 text-right">In</th>
                        <th className="py-2 pr-3 text-right">Out</th>
                        <th className="py-2 text-right">Net</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((category) => (
                        <CategoryRow
                            key={category.categoryId}
                            category={category}
                            locale={locale}
                        />
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
            className="border-base-300 bg-base-100 relative flex w-full items-center justify-between rounded-xl border px-4 py-3 shadow-sm"
        >
            <span className="text-base-content/70 text-sm font-medium">{label}</span>

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
                className="text-base-content/60 hover:bg-base-200 hover:text-base-content/80 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            >
                <Info
                    className="text-primary hover:bg-primary/10 h-4 w-4 rounded-full transition-all hover:h-8 hover:w-8 hover:p-1"
                    strokeWidth={3}
                />
            </button>

            {open && (
                <div
                    className="bg-base-100 fixed inset-x-4 top-1/2 z-20 max-h-[min(70dvh,32rem)] -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-400 p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:top-full sm:right-12 sm:mt-2 sm:max-h-[min(70dvh,32rem)] sm:w-[480px] sm:max-w-[90vw] sm:-translate-y-1/2"
                    role="tooltip"
                >
                    <CategoryTable range={range} />
                </div>
            )}
        </div>
    );
}
