'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/features/budgets/utils';
import { useRecurring } from '@/features/recurring/hooks/use-recurring';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

const DAYS_AHEAD = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dueLabel(date: Date) {
    const diff = Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
}

export function UpcomingRecurring() {
    const locale = useUserLocale();
    const { data } = useRecurring();

    const upcoming = useMemo(() => {
        const today = startOfDay(new Date());
        const limit = today + (DAYS_AHEAD + 1) * DAY_MS;
        return (data ?? [])
            .filter((r) => {
                if (!r.isActive || !r.nextRunAt) return false;
                const t = new Date(r.nextRunAt).getTime();
                return t >= today && t < limit;
            })
            .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime());
    }, [data]);

    const totals = useMemo(() => {
        const sum = (type: 'CREDIT' | 'DEBIT') =>
            upcoming.filter((r) => r.type === type).reduce((acc, r) => acc + Number(r.amount), 0); 
        return { income: sum('CREDIT'), expense: sum('DEBIT') };
    }, [upcoming]);

    if (upcoming.length === 0) return null;

    return (
        <div className="border-base-300 bg-base-100 rounded-xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <CalendarClock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base-content text-sm font-semibold">
                            Upcoming recurring transactions
                        </p>
                        <p className="text-base-content/60 text-xs">
                            These will be recorded automatically in the next {DAYS_AHEAD} days.
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/recurring">
                    <Button>Manage recurring</Button>
                </Link>
            </div>

            <ul className="divide-base-300 mt-4 divide-y">
                {upcoming.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <Repeat className="text-base-content/40 h-4 w-4 shrink-0" />
                            <span className="text-base-content truncate text-sm font-medium">
                                {r.description || 'Untitled'}
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                            <span className="text-base-content/60 text-xs">
                                {dueLabel(new Date(r.nextRunAt))}
                            </span>
                            <span
                                className={`text-sm font-semibold ${
                                    r.type === 'CREDIT' ? 'text-success' : 'text-base-content'
                                }`}
                            >
                                {r.type === 'CREDIT' ? '+' : '-'}
                                {formatINR(Number(r.amount), locale)}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="border-base-300 text-base-content/60 mt-3 flex justify-between border-t pt-3 text-xs">
                <span>
                    Income: <b className="text-success">{formatINR(totals.income, locale)}</b>
                </span>
                <span>
                    Expenses: <b className="text-base-content">{formatINR(totals.expense, locale)}</b>
                </span>
            </div>
        </div>
    );
}