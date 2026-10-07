'use client';

import { Building2, CalendarPlus, Receipt, Users } from 'lucide-react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartCard } from '@/components/ui/chart/ChartCard';
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/ui/toast';
import { formatAdminDate } from '../../shared/lib/format-date';
import { useAdminDashboard } from '../hooks/use-admin-dashboard';
import { RecentActivityCard } from '../../audit-logs';

const number = new Intl.NumberFormat('en-IN');
const dateLabel = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });

function NewWorkspacesCard({
    workspaces,
    total,
    isLoading,
}: {
    workspaces: { id: string; name: string; createdAt: string }[];
    total: number;
    isLoading: boolean;
}) {
    return (
        <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-base-content text-sm font-semibold">New workspaces</p>
                    <p className="text-base-content/60 text-xs">
                        Latest created · {number.format(total)} total
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-base-200 h-8 animate-pulse rounded" />
                    ))}
                </div>
            ) : workspaces.length === 0 ? (
                <p className="text-base-content/60 mt-4 text-center text-sm">No workspaces yet.</p>
            ) : (
                <ul className="divide-base-300 mt-4 divide-y">
                    {workspaces.map((w) => (
                        <li key={w.id} className="flex items-center justify-between gap-3 py-2.5">
                            <span className="text-base-content truncate text-sm font-medium">
                                {w.name}
                            </span>
                            <span className="text-base-content/60 shrink-0 text-xs">
                                {formatAdminDate(w.createdAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function AdminDashboardPage() {
    const { data, isLoading, isError, error, refetch } = useAdminDashboard();

    if (isError && !data)
        return (
            <div className="border-error/30 bg-error/10 mx-auto max-w-7xl rounded-xl border p-6 text-center">
                <p className="text-error text-sm">
                    {getErrorMessage(error, 'Failed to load platform overview.')}
                </p>
                <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
                    Try again
                </Button>
            </div>
        );

    const stats = data
        ? [
              {
                  title: 'Total Users',
                  value: number.format(data.users.total),
                  caption: `${number.format(data.users.active)} active · ${number.format(data.users.inactive)} inactive`,
                  icon: Users,
              },
              {
                  title: 'Active Users',
                  value: number.format(data.users.active),
                  icon: CalendarPlus,
              },
              {
                  title: 'Workspaces',
                  value: number.format(data.workspaces.total),
                  caption: `${number.format(data.workspaces.active)} active · ${number.format(data.workspaces.inactive)} inactive`,
                  icon: Building2,
              },
              {
                  title: 'Transactions',
                  value: number.format(data.transactions.total),
                  icon: Receipt,
              },
          ]
        : [];

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">
                    Platform dashboard
                </h1>
                <p className="text-base-content/60 text-sm">
                    Users, workspaces, and platform activity.
                </p>
            </div>

            {/* 1. Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {isLoading || !data
                    ? Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index} />)
                    : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
            </div>

            {/* 2. Growth chart, full width */}
            <ChartCard
                title="Daily activity and growth"
                description="Transactions created and new users over the last 30 days"
                isLoading={isLoading}
                isError={isError}
                isEmpty={
                    !!data &&
                    data.activity.every((point) => point.transactions === 0 && point.users === 0)
                }
                emptyMessage="No activity in this period."
                onRetry={() => void refetch()}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data?.activity ?? []}
                        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--color-base-300)"
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={dateLabel}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-base-content)' }}
                            fontSize={12}
                            minTickGap={24}
                        />
                        <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: 'var(--color-base-content)' }}
                            fontSize={12}
                            width={40}
                        />
                        <Tooltip
                            labelFormatter={(label) => dateLabel(String(label))}
                            contentStyle={{
                                background: 'var(--color-base-100)',
                                border: '1px solid var(--color-base-300)',
                                color: 'var(--color-base-content)',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="transactions"
                            name="Transactions"
                            stroke="var(--color-primary)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="users"
                            name="New users"
                            stroke="var(--color-success)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* 3. Two columns: new workspaces | recent activity */}
            <div className="grid items-start gap-5 lg:grid-cols-2">
                <NewWorkspacesCard
                    workspaces={data?.workspaces.recent ?? []}
                    total={data?.workspaces.total ?? 0}
                    isLoading={isLoading}
                />
                <RecentActivityCard />
            </div>

            {isError && data && (
                <p className="text-error text-sm">Could not refresh the dashboard data.</p>
            )}
        </div>
    );
}
