'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import { useCategorySummary } from '../hooks/use-categories';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { CategorySummary, DateRange } from '../types';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

function netColor(net: number) {
    if (net > 0) return 'text-success';
    if (net < 0) return 'text-error';
    return 'text-base-content';
}

function CategoryRow({ category }: { category: CategorySummary }) {
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
                    {currency.format(category.income)}
                </span>
            </td>
            <td className="py-2.5 pr-3 text-right text-sm text-base-content/70">
                <span className="inline-flex items-center gap-1">
                    <ArrowDownLeft className="h-3.5 w-3.5 text-error" />
                    {currency.format(category.expense)}
                </span>
            </td>
            <td className={`py-2.5 text-right text-sm font-semibold ${netColor(category.net)}`}>
                {currency.format(category.net)}
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
                        <CategoryRow key={category.categoryId} category={category} />
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

    return (
        <div
            className="relative flex w-full items-center justify-between rounded-xl border border-base-300 bg-base-100 px-4 py-3 shadow-sm"
        >
            <span className="text-sm font-medium text-base-content/70">{label}</span>

            <button
                type="button"
                aria-label="Show category breakdown"
                aria-expanded={open}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content/80"
            >
                <Info
                    className="h-4 w-4 text-primary hover:h-8 hover:w-8 transition-all hover:p-1 rounded-full hover:bg-primary/10" strokeWidth={3} onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                />
            </button>

            {open && (
                <div
                    className="absolute right-12 top-full -translate-y-1/2 z-20 mt-2 w-[480px] max-w-[90vw] rounded-xl border border-slate-400 bg-base-100 p-4 shadow-2xl"
                    role="tooltip"
                >
                    <CategoryTable range={range} />
                </div>
            )}
        </div>
    );
}