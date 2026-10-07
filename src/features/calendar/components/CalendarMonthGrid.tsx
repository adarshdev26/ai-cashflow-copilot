'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { addDaysKey } from '../lib/calendar-dates';
import type { CalendarDay } from '../types';
import { CalendarEventChip, EVENT_STYLES } from './CalendarEventChip';

const MAX_CHIPS = 2;
const MAX_DOTS = 4;

function dayLabel(date: string, locale: string) {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

function weekdayLabels(locale: string, weekStartsOn: number) {
    // 2024-01-07 is a Sunday, so 7 + weekStartsOn lands on the right weekday.
    return Array.from({ length: 7 }, (_, i) =>
        new Date(Date.UTC(2024, 0, 7 + weekStartsOn + i)).toLocaleDateString(locale, {
            weekday: 'short',
            timeZone: 'UTC',
        }),
    );
}

export function CalendarMonthGrid({
    month,
    days,
    selected,
    today,
    weekStartsOn,
    locale,
    onSelect,
    onOpen,
}: {
    month: string;
    days: CalendarDay[];
    selected: string;
    today: string;
    weekStartsOn: number;
    locale: string;
    onSelect: (date: string) => void;
    onOpen?: (date: string) => void;
}) {
    const refs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const keys = new Set(days.map((d) => d.date));
    const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
        days.slice(i * 7, i * 7 + 7),
    );

    function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, date: string) {
        const step =
            e.key === 'ArrowLeft'
                ? -1
                : e.key === 'ArrowRight'
                  ? 1
                  : e.key === 'ArrowUp'
                    ? -7
                    : e.key === 'ArrowDown'
                      ? 7
                      : 0;
        if (!step) return;
        e.preventDefault();
        const next = addDaysKey(date, step);
        if (!keys.has(next)) return;
        onSelect(next);
        requestAnimationFrame(() => refs.current.get(next)?.focus());
    }

    return (
        <div
            role="grid"
            aria-label="Financial calendar"
            className="border-base-300 bg-base-100 rounded-xl border p-2 shadow-sm sm:p-3"
        >
            <div role="row" className="mb-1 grid grid-cols-7 gap-1">
                {weekdayLabels(locale, weekStartsOn).map((label) => (
                    <div
                        key={label}
                        role="columnheader"
                        className="text-base-content/60 py-1 text-center text-[11px] font-medium tracking-wide uppercase"
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className="space-y-1">
                {weeks.map((week) => (
                    <div key={week[0].date} role="row" className="grid grid-cols-7 gap-1">
                        {week.map((day) => {
                            const isSelected = day.date === selected;
                            const isToday = day.date === today;
                            const inMonth = day.date.slice(0, 7) === month;
                            const count = day.events.length;
                            return (
                                <div key={day.date} role="gridcell" aria-selected={isSelected}>
                                    <button
                                        type="button"
                                        ref={(el) => {
                                            if (el) refs.current.set(day.date, el);
                                            else refs.current.delete(day.date);
                                        }}
                                        tabIndex={isSelected ? 0 : -1}
                                        aria-label={`${dayLabel(day.date, locale)}, ${count} ${count === 1 ? 'event' : 'events'}`}
                                        onClick={() => {
                                            onSelect(day.date);
                                            onOpen?.(day.date);
                                        }}
                                        onKeyDown={(e) => onKeyDown(e, day.date)}
                                        className={cn(
                                            'flex min-h-16 w-full min-w-0 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-24',
                                            'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
                                            inMonth
                                                ? 'border-base-300 bg-base-100 hover:bg-base-200'
                                                : 'border-base-200 bg-base-200/40 text-base-content/40 hover:bg-base-200',
                                            isSelected && 'border-primary ring-primary ring-1',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                                                isToday && 'bg-primary text-primary-content',
                                            )}
                                        >
                                            {Number(day.date.slice(8))}
                                        </span>

                                        <div className="hidden min-w-0 flex-col gap-1 sm:flex">
                                            {day.events.slice(0, MAX_CHIPS).map((event) => (
                                                <CalendarEventChip key={event.id} event={event} />
                                            ))}
                                            {count > MAX_CHIPS && (
                                                <span className="text-base-content/60 text-[11px]">
                                                    +{count - MAX_CHIPS} more
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className="flex flex-wrap gap-0.5 sm:hidden"
                                            aria-hidden="true"
                                        >
                                            {day.events.slice(0, MAX_DOTS).map((event) => (
                                                <span
                                                    key={event.id}
                                                    className={cn(
                                                        'h-1.5 w-1.5 rounded-full',
                                                        EVENT_STYLES[event.kind].dot,
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
