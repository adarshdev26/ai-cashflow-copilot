'use client';

import {
    Building2,
    CalendarPlus,
    FolderTree,
    Mail,
    Receipt,
    UserRoundCheck,
    Users,
} from 'lucide-react';
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
import { useAdminDashboard } from '../hooks/use-admin-dashboard';
import { RecentActivityCard } from '../../audit-logs';

const number = new Intl.NumberFormat('en-IN');
const dateLabel = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });

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
                  title: 'Users',
                  value: number.format(data.users.total),
                  caption: `${number.format(data.users.active)} active · ${number.format(data.users.inactive)} inactive`,
                  icon: Users,
              },
              {
                  title: 'New users · 7 days',
                  value: number.format(data.users.new7Days),
                  icon: CalendarPlus,
              },
              {
                  title: 'New users · 30 days',
                  value: number.format(data.users.new30Days),
                  icon: UserRoundCheck,
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
              {
                  title: 'Pending invitations',
                  value: number.format(data.pendingInvitations),
                  icon: Mail,
              },
              {
                  title: 'Global categories',
                  value: number.format(data.categories.global),
                  icon: FolderTree,
              },
              {
                  title: 'Custom categories',
                  value: number.format(data.categories.custom),
                  icon: FolderTree,
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {isLoading || !data
                    ? Array.from({ length: 8 }, (_, index) => <StatCardSkeleton key={index} />)
                    : stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
            </div>

            <RecentActivityCard/>

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
            {isError && data && (
                <p className="text-error text-sm">Could not refresh the dashboard data.</p>
            )}
        </div>
    );
}
