'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/ui/toast';
import { useRecentActivity } from '../hooks/use-recent-activity';
import { AuditLogListItem } from './AuditLogListItem';
import { AuditLogDetails } from './AuditLogDetails';

export function RecentActivityCard() {
    const { data, isLoading, isError, error, refetch } = useRecentActivity(8);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const events = data?.data ?? [];

    return (
        <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base-content text-sm font-semibold">Recent activity</p>
                        <p className="text-base-content/60 text-xs">
                            Latest actions across the platform.
                        </p>
                    </div>
                </div>
                <Link href="/admin/audit-logs">
                    <Button variant="secondary">View full audit log</Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="mt-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-base-200 h-8 animate-pulse rounded" />
                    ))}
                </div>
            ) : isError ? (
                <div className="mt-4 text-center">
                    <p className="text-error text-sm">
                        {getErrorMessage(error, 'Failed to load activity.')}
                    </p>
                    <Button variant="secondary" className="mt-2" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : events.length === 0 ? (
                <p className="text-base-content/60 mt-4 text-center text-sm">
                    No activity recorded yet.
                </p>
            ) : (
                <ul className="divide-base-300 mt-4 divide-y">
                    {events.map((e) => (
                        <AuditLogListItem key={e.id} event={e} onView={setSelectedId} />
                    ))}
                </ul>
            )}

            <AuditLogDetails eventId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
    );
}