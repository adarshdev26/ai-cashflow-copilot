'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { monthLabel } from '@/features/budgets/utils';
import { useUserLocale } from '@/features/settings/hooks/use-settings';
import { useCalendarMonth } from '@/features/calendar/hooks/use-calendar';
import { monthKeyOf } from '@/features/calendar/lib/calendar-dates';
import { CalendarMonthGrid } from '@/features/calendar/components/CalendarMonthGrid';
import { CalendarDayPanel } from '@/features/calendar/components/CalendarDayPanel';
import { CalendarLegend } from '@/features/calendar/components/CalendarLegend';
import {
    CalendarErrorState,
    CalendarLoadingState,
} from '@/features/calendar/components/CalendarStates';

function currentCursor() {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
}

export default function CalendarPage() {
    const locale = useUserLocale();
    const [cursor, setCursor] = useState(currentCursor);
    const [selected, setSelected] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const monthKey = monthKeyOf(cursor.year, cursor.month);
    const { data, isLoading, isFetching, isError, error } = useCalendarMonth(monthKey);

    const days = data?.days ?? [];
    const gridMonth = data?.month ?? monthKey;
    const today = data?.today ?? '';
    const defaultSelected =
        data && data.today.slice(0, 7) === data.month ? data.today : `${gridMonth}-01`;
    const activeDate =
        selected && days.some((d) => d.date === selected) ? selected : defaultSelected;
    const activeDay = days.find((d) => d.date === activeDate) ?? null;
    const hasEvents = days.some((d) => d.events.length > 0);

    function shiftMonth(delta: number) {
        setSelected(null);
        setCursor((c) => {
            const d = new Date(c.year, c.month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    }

    function goToToday() {
        setSelected(null);
        setCursor(currentCursor());
    }

    function handleOpen() {
        if (window.matchMedia('(min-width: 1280px)').matches) return;
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <h1 className="text-base-content text-2xl font-bold tracking-tight">Calendar</h1>
                <p className="text-base-content/60 text-sm">
                    Recurring payments, upcoming transactions, goal deadlines and budget periods.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="secondary"
                    aria-label="Previous month"
                    onClick={() => shiftMonth(-1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span
                    className="text-base-content min-w-40 text-center text-sm font-semibold"
                    aria-live="polite"
                >
                    {monthLabel(cursor.year, cursor.month, locale)}
                </span>
                <Button variant="secondary" aria-label="Next month" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={goToToday}>
                    Today
                </Button>
            </div>

            <CalendarLegend />

            {isError ? (
                <CalendarErrorState
                    message={error instanceof Error ? error.message : 'Failed to load calendar'}
                />
            ) : isLoading || !data ? (
                <CalendarLoadingState />
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <div
                        className={
                            isFetching ? 'space-y-3 opacity-60 transition-opacity' : 'space-y-3'
                        }
                        aria-busy={isFetching}
                    >
                        <CalendarMonthGrid
                            month={gridMonth}
                            days={days}
                            selected={activeDate}
                            today={today}
                            weekStartsOn={data.weekStartsOn}
                            locale={locale}
                            onSelect={setSelected}
                            onOpen={handleOpen}
                        />
                        {!hasEvents && (
                            <p className="text-base-content/60 text-sm">
                                Nothing scheduled this month. Recurring payments, goals and budgets
                                appear here automatically.
                            </p>
                        )}
                        {data.truncated && (
                            <p className="text-warning text-xs">
                                This month has a very large number of transactions, so daily
                                balances may be incomplete.
                            </p>
                        )}
                    </div>
                    <div ref={panelRef} className="xl:sticky xl:top-0 xl:self-start">
                        <CalendarDayPanel day={activeDay} today={today} locale={locale} />
                    </div>
                </div>
            )}
        </div>
    );
}
