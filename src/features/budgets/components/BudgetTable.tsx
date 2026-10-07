'use client';

import { memo, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PiggyBank, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import type { BudgetUsage } from '../types';
import { categoryColor, formatINR, usageTone } from '../utils';
import { useUserPreferences } from '@/features/settings/hooks/use-settings';

interface BudgetTableProps {
    budgets?: BudgetUsage[];
    canManage: boolean;
    onEdit: (b: BudgetUsage) => void;
    onDeactivate: (b: BudgetUsage) => void;
    isLoading?: boolean;
    isFetching?: boolean;
    warningPercent: number;
    exceededPercent: number;
}

function StatusBadge({
    budget,
    warningPercent,
    exceededPercent,
}: {
    budget: BudgetUsage;
    warningPercent: number;
    exceededPercent: number;
}) {
    if (budget.percentUsed > exceededPercent) {
        return (
            <span className="bg-error/10 text-error inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Over budget
            </span>
        );
    }
    if (budget.percentUsed >= warningPercent) {
        return (
            <span className="bg-warning/10 text-warning inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Near limit
            </span>
        );
    }
    return (
        <span className="bg-success/10 text-success inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
            On track
        </span>
    );
}

export const BudgetTable = memo(function BudgetTable({
    budgets = [],
    canManage,
    onEdit,
    onDeactivate,
    isLoading,
    isFetching,
    warningPercent,
    exceededPercent,
}: BudgetTableProps) {
    const { data: preferences } = useUserPreferences();
    const locale = String(preferences?.locale ?? 'en-IN');
    const pageSize = Number(preferences?.tablePageSize ?? 10);
    const density = preferences?.tableDensity === 'compact' ? 'compact' : 'comfortable';
    const columns = useMemo<ColumnDef<BudgetUsage>[]>(() => {
        const base: ColumnDef<BudgetUsage>[] = [
            {
                id: 'category',
                header: 'Category',
                enableSorting: true,
                accessorFn: (row) => row.category.name,
                cell: ({ row }) => {
                    const b = row.original;
                    const color = categoryColor(b.category.color);
                    return (
                        <div className="text-base-content flex items-center gap-3 font-medium">
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${color}1A`, color }}
                            >
                                <PiggyBank className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate">{b.category.name}</p>
                                <p className="text-base-content/50 text-xs font-normal">
                                    Monthly{!b.category.isActive ? ' · category inactive' : ''}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'amount',
                header: 'Budget',
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-base-content font-semibold">
                        {formatINR(row.original.amount, locale)}
                    </span>
                ),
            },
            {
                accessorKey: 'spent',
                header: 'Spent',
                enableSorting: true,
                cell: ({ row }) => (
                    <span className="text-base-content/80 font-medium">
                        {formatINR(row.original.spent, locale)}
                    </span>
                ),
            },
            {
                accessorKey: 'remaining',
                header: 'Remaining',
                enableSorting: true,
                cell: ({ row }) => {
                    const r = row.original.remaining;
                    return r >= 0 ? (
                        <span className="text-base-content/80">{formatINR(r, locale)}</span>
                    ) : (
                        <span className="text-error font-medium">
                            {formatINR(Math.abs(r), locale)} over
                        </span>
                    );
                },
            },
            {
                accessorKey: 'percentUsed',
                header: 'Usage',
                enableSorting: true,
                cell: ({ row }) => {
                    const tone = usageTone(
                        row.original.percentUsed,
                        warningPercent,
                        exceededPercent,
                    );
                    const width = Math.min(row.original.percentUsed, 100);
                    return (
                        <div className="flex items-center gap-3">
                            <div className="bg-base-200 h-2 w-28 overflow-hidden rounded-full">
                                <div
                                    className={`h-full rounded-full ${tone.bar}`}
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                            <span className={`text-xs font-semibold ${tone.text}`}>
                                {Math.round(row.original.percentUsed)}%
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                header: 'Status',
                enableSorting: false,
                cell: ({ row }) => (
                    <StatusBadge
                        budget={row.original}
                        warningPercent={warningPercent}
                        exceededPercent={exceededPercent}
                    />
                ),
            },
        ];

        if (!canManage) return base;

        return [
            ...base,
            {
                id: 'actions',
                enableSorting: false,
                cell: ({ row }) => {
                    const b = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Edit budget"
                                onClick={() => onEdit(b)}
                            >
                                <Pencil className="text-primary h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Remove budget"
                                onClick={() => onDeactivate(b)}
                            >
                                <Trash2 className="text-error h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ];
    }, [canManage, onEdit, onDeactivate, warningPercent, exceededPercent, locale]);

    return (
        <DataTable
            key={pageSize}
            columns={columns}
            data={budgets}
            searchKey="category"
            searchPlaceholder="Search budgets..."
            pageSize={pageSize}
            density={density}
            isLoading={isLoading}
            isFetching={isFetching}
        />
    );
});
