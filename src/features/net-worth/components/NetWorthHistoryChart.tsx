'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useActiveWorkspaceId } from '@/features/workspaces';
import {
    useUserPreferences,
    useUpdateUserPreferences,
} from '@/features/settings/hooks/use-settings';
import { useNetWorthHistory } from '../hooks/use-net-worth';
import { ChartCard } from '@/features/dashboard/components/ChartCard';
import { RangeSelect } from '@/features/dashboard/components/RangeSelect';
import {
    formatCompact,
    formatCurrency,
    formatReportBucket,
} from '@/features/dashboard/components/chart-utils';

type NetWorthMonths = number | 'all';

const OPTIONS: { value: NetWorthMonths; label: string }[] = [
    { value: 3, label: 'Last 3 months' },
    { value: 6, label: 'Last 6 months' },
    { value: 12, label: 'Last 12 months' },
    { value: 24, label: 'Last 24 months' },
    { value: 'all', label: 'All time' },
];

export function NetWorthHistoryChart() {
    const workspaceId = useActiveWorkspaceId();
    const { data: preferences, isPlaceholderData } = useUserPreferences();
    const updatePreferences = useUpdateUserPreferences();
    const storedMonths = preferences?.netWorthMonths ?? 6;
    const months = (storedMonths === 'all' ? 'all' : Number(storedMonths)) as NetWorthMonths;
    const locale = String(preferences?.locale ?? 'en-IN');
    const { data, isLoading, isError, isFetching, refetch } = useNetWorthHistory(
        workspaceId,
        String(months),
    );
    const isEmpty = !!data && data.every((point) => point.netWorth === 0);

    return (
        <ChartCard
            title="Net worth history"
            description={
                months === 'all' ? 'Monthly net worth (up to 5 years)' : 'Monthly net worth'
            }
            action={
                <RangeSelect
                    label="Net worth history range"
                    value={months}
                    options={OPTIONS}
                    disabled={isPlaceholderData}
                    onChange={(value) => updatePreferences.mutate({ netWorthMonths: value })}
                />
            }
            isLoading={isLoading}
            isError={isError}
            isEmpty={isEmpty}
            emptyMessage={
                months === 'all'
                    ? 'No net worth history available yet.'
                    : `No net worth history in the last ${months} months.`
            }
            onRetry={() => refetch()}
        >
            <div
                className={`h-full transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}
                aria-busy={isFetching}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0.25}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-primary)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--color-base-300)"
                        />
                        <XAxis
                            dataKey="month"
                            tickFormatter={(value) =>
                                formatReportBucket(String(value), 'month', locale)
                            }
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
                        <Tooltip
                            labelFormatter={(label) =>
                                formatReportBucket(String(label), 'month', locale)
                            }
                            formatter={(value) => [
                                formatCurrency(Number(value), locale),
                                'Net worth',
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            name="Net worth"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            fill="url(#netWorthFill)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}
