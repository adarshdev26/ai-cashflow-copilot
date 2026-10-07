'use client';

import { useActiveWorkspaceId } from '@/features/workspaces';
import { NetWorthSummaryCard } from '@/features/net-worth/components/NetWorthSummary';
import { useNetWorth } from '@/features/net-worth/hooks/use-net-worth';

export default function NetWorthPage() {
    const workspaceId = useActiveWorkspaceId();
    const { data, isLoading, error } = useNetWorth(workspaceId);

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">Net Worth</h1>
                <p className="text-base-content/60 mt-1 text-sm">
                    Track your assets, liabilities, and overall financial position.
                </p>
            </div>

            {error ? (
                <div className="border-error/30 bg-error/10 text-error rounded-xl border p-4 text-sm">
                    {error instanceof Error ? error.message : 'Unable to load net worth.'}
                </div>
            ) : (
                <NetWorthSummaryCard data={isLoading ? null : data} />
            )}

            {data && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
                        <h2 className="text-base-content text-lg font-semibold">Assets</h2>
                        <div className="mt-4 space-y-3">
                            {data.assets.length === 0 ? (
                                <p className="text-base-content/60 text-sm">
                                    No asset accounts yet.
                                </p>
                            ) : (
                                data.assets.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div>
                                            <p className="text-base-content text-sm font-medium">
                                                {account.name}
                                            </p>
                                            <p className="text-base-content/60 text-xs">
                                                {account.type}
                                            </p>
                                        </div>
                                        <span className="text-base-content text-sm font-semibold">
                                            {new Intl.NumberFormat('en-IN', {
                                                style: 'currency',
                                                currency: account.currency || 'INR',
                                            }).format(account.balance)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
                        <h2 className="text-base-content text-lg font-semibold">Liabilities</h2>
                        <div className="mt-4 space-y-3">
                            {data.liabilities.length === 0 ? (
                                <p className="text-base-content/60 text-sm">
                                    No liabilities recorded yet.
                                </p>
                            ) : (
                                data.liabilities.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div>
                                            <p className="text-base-content text-sm font-medium">
                                                {account.name}
                                            </p>
                                            <p className="text-base-content/60 text-xs">
                                                {account.type}
                                            </p>
                                        </div>
                                        <span className="text-error text-sm font-semibold">
                                            {new Intl.NumberFormat('en-IN', {
                                                style: 'currency',
                                                currency: account.currency || 'INR',
                                            }).format(Math.abs(account.balance))}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
