import { cn } from '@/lib/cn';
import { EVENT_STYLES } from './CalendarEventChip';
import type { CalendarEventKind } from '../types';

const LEGEND: { kind: CalendarEventKind; label: string }[] = [
    { kind: 'INCOME', label: 'Income' },
    { kind: 'EXPENSE', label: 'Expense' },
    { kind: 'TRANSFER', label: 'Transfer' },
    { kind: 'GOAL_DEADLINE', label: 'Goal deadline' },
    { kind: 'BUDGET_START', label: 'Budget period' },
];

export function CalendarLegend() {
    return (
        <div className="text-base-content/70 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {LEGEND.map(({ kind, label }) => (
                <span key={kind} className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2.5 w-2.5 rounded-full', EVENT_STYLES[kind].dot)} />
                    {label}
                </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
                <span className="border-base-content/50 h-3 w-5 rounded border border-dashed" />
                Projected (not posted yet)
            </span>
        </div>
    );
}
