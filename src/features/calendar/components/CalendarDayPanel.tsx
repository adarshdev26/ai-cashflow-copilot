'use client';

import Link from 'next/link';
import { ArrowLeftRight, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatINR } from '@/features/budgets/utils';
import type { CalendarDay, CalendarEvent, CalendarEventKind } from '../types';

const SECTIONS: { title: string; kinds: CalendarEventKind[] }[] = [
    { title: 'Income', kinds: ['INCOME'] },
    { title: 'Expenses', kinds: ['EXPENSE'] },
    { title: 'Transfers', kinds: ['TRANSFER'] },
    { title: 'Goal deadlines', kinds: ['GOAL_DEADLINE'] },
    { title: 'Budget periods', kinds: ['BUDGET_START', 'BUDGET_END'] },
];

function heading(date: string, locale: string) {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

function subtitle(event: CalendarEvent, today: string, locale: string): string {
    const parts: string[] = [];
    if (event.kind === 'GOAL_DEADLINE' && event.meta) {
        if (event.meta.remainingAmount !== undefined) {
            parts.push(`${formatINR(event.meta.remainingAmount, locale)} remaining`);
        }
        if (event.meta.requiredMonthlyContribution != null) {
            parts.push(`${formatINR(event.meta.requiredMonthlyContribution, locale)}/month needed`);
        }
    } else if (event.kind === 'BUDGET_START' || event.kind === 'BUDGET_END') {
        parts.push(event.kind === 'BUDGET_START' ? 'Period starts' : 'Period ends');
        if (event.meta?.budgetAmount !== undefined) {
            parts.push(formatINR(event.meta.budgetAmount, locale));
        }
    } else {
        if (event.accountName && event.kind !== 'TRANSFER') parts.push(event.accountName);
        if (event.categoryName) parts.push(event.categoryName);
        if (event.isRecurring) parts.push('Recurring');
        if (event.isProjected) parts.push('Projected');
        else if (event.date > today) parts.push('Upcoming');
    }
    return parts.join(' · ');
}

function amountText(event: CalendarEvent, locale: string): string | null {
    if (event.amount === null) return null;
    const text = formatINR(event.amount, locale);
    if (event.kind === 'INCOME') return `+${text}`;
    if (event.kind === 'EXPENSE') return `-${text}`;
    return text;
}

export function CalendarDayPanel({
    day,
    today,
    locale,
}: {
    day: CalendarDay | null;
    today: string;
    locale: string;
}) {
    if (!day) {
        return (
            <aside className="border-base-300 bg-base-100 text-base-content/60 rounded-xl border p-5 text-sm shadow-sm">
                Select a date to see its details.
            </aside>
        );
    }

    const tiles = [
        { label: 'Income', value: day.income, icon: TrendingUp, tone: 'text-success' },
        { label: 'Expenses', value: day.expenses, icon: TrendingDown, tone: 'text-error' },
        { label: 'Transfers', value: day.transfers, icon: ArrowLeftRight, tone: 'text-info' },
        {
            label: 'Expected balance',
            value: day.expectedBalance,
            icon: Scale,
            tone: day.expectedBalance < 0 ? 'text-error' : 'text-base-content',
        },
    ];

    return (
        <aside className="border-base-300 bg-base-100 space-y-5 rounded-xl border p-5 shadow-sm">
            <div>
                <h2 className="text-base-content text-lg font-semibold">
                    {heading(day.date, locale)}
                </h2>
                <p className="text-base-content/60 text-xs">
                    {day.date === today ? 'Today' : day.date > today ? 'Upcoming' : 'Past'} ·
                    balance is as of end of day
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {tiles.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="border-base-300 rounded-lg border p-3">
                        <div className="text-base-content/60 flex items-center gap-1.5 text-xs">
                            <Icon className={cn('h-3.5 w-3.5', tone)} />
                            {label}
                        </div>
                        <p className={cn('mt-1 text-base font-semibold', tone)}>
                            {formatINR(value, locale)}
                        </p>
                    </div>
                ))}
            </div>

            {day.events.length === 0 ? (
                <p className="text-base-content/60 text-sm">Nothing scheduled for this day.</p>
            ) : (
                SECTIONS.map((section) => {
                    const events = day.events.filter((e) => section.kinds.includes(e.kind));
                    if (events.length === 0) return null;
                    return (
                        <section key={section.title}>
                            <h3 className="text-base-content/60 mb-2 text-xs font-semibold tracking-wide uppercase">
                                {section.title}
                            </h3>
                            <ul className="divide-base-300 divide-y">
                                {events.map((event) => {
                                    const sub = subtitle(event, today, locale);
                                    const amount = amountText(event, locale);
                                    const body = (
                                        <div className="flex items-start justify-between gap-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-base-content truncate text-sm font-medium">
                                                    {event.title}
                                                </p>
                                                {sub && (
                                                    <p className="text-base-content/60 truncate text-xs">
                                                        {sub}
                                                    </p>
                                                )}
                                            </div>
                                            {amount && (
                                                <span
                                                    className={cn(
                                                        'shrink-0 text-sm font-semibold',
                                                        event.kind === 'INCOME' && 'text-success',
                                                        event.kind === 'EXPENSE' && 'text-error',
                                                    )}
                                                >
                                                    {amount}
                                                </span>
                                            )}
                                        </div>
                                    );
                                    return (
                                        <li key={event.id}>
                                            {event.href ? (
                                                <Link
                                                    href={event.href}
                                                    className="hover:bg-base-200 -mx-2 block rounded-lg px-2"
                                                >
                                                    {body}
                                                </Link>
                                            ) : (
                                                body
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })
            )}
        </aside>
    );
}
