'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useCashflow } from '../hooks/use-cashflow';
import { useActiveWorkspaceId } from '@/features/workspaces';
import { MonthsRange } from '../types';
import { ChartCard } from './ChartCard';
import { RangeSelect } from './RangeSelect';
import { formatCompact, formatCurrency, formatReportBucket } from './chart-utils';
import {
    useUserPreferences,
    useUpdateUserPreferences,
} from '@/features/settings/hooks/use-settings';

const OPTIONS: { value: MonthsRange; label: string }[] = [
    { value: 3, label: 'Last 3 months' },
    { value: 6, label: 'Last 6 months' },
    { value: 12, label: 'Last 12 months' },
    { value: 24, label: 'Last 24 months' },
    { value: 'all', label: 'All time' },
];

export function CashflowChart() {
    const workspaceId = useActiveWorkspaceId();
    const { data: preferences, isPlaceholderData } = useUserPreferences();
    const updatePreferences = useUpdateUserPreferences();
    const months = Number(preferences?.cashflowMonths ?? 6) as MonthsRange;
    const locale = String(preferences?.locale ?? 'en-IN');
    const { data, isLoading, isError, isFetching } = useCashflow(workspaceId, months);
    const chartData = data?.map((point) => ({
        ...point,
        label: formatReportBucket(point.key, 'month', locale),
    }));
    const isEmpty = !!data && data.every((p) => p.income === 0 && p.expense === 0);

    return (
        <ChartCard
            tourId="overview-cashflow"
            exportTourId="overview-cashflow-png"
            title="Income vs Expense"
            description="Monthly totals"
            action={
                <RangeSelect
                    label="Cashflow range"
                    value={months}
                    options={OPTIONS}
                    disabled={isPlaceholderData}
                    onChange={(value) => updatePreferences.mutate({ cashflowMonths: value })}
                />
            }
            isLoading={isLoading}
            isError={isError}
            isEmpty={isEmpty}
            emptyMessage={
                months === 'all'
                    ? 'No transactions yet.'
                    : `No transactions in the last ${months} months.`
            }
        >
            <div
                className={`h-full transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}
                aria-busy={isFetching}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--color-base-300)"
                        />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-base-content)' }}
                            fontSize={12}
                            minTickGap={12}
                        />
                        <YAxis
                            tickFormatter={(value) => formatCompact(Number(value), locale)}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-base-content)' }}
                            fontSize={12}
                            width={56}
                        />
                        <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                        <Legend />
                        <Bar
                            dataKey="income"
                            name="Income"
                            fill="var(--color-success)"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="expense"
                            name="Expense"
                            fill="var(--color-error)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
