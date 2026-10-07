import {
    ArrowLeftRight,
    Flag,
    Target,
    TrendingDown,
    TrendingUp,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CalendarEvent, CalendarEventKind } from '../types';

export const EVENT_STYLES: Record<
    CalendarEventKind,
    { icon: LucideIcon; chip: string; dot: string; label: string }
> = {
    INCOME: {
        icon: TrendingUp,
        chip: 'bg-success/10 text-success',
        dot: 'bg-success',
        label: 'Income',
    },
    EXPENSE: {
        icon: TrendingDown,
        chip: 'bg-error/10 text-error',
        dot: 'bg-error',
        label: 'Expense',
    },
    TRANSFER: {
        icon: ArrowLeftRight,
        chip: 'bg-info/10 text-info',
        dot: 'bg-info',
        label: 'Transfer',
    },
    GOAL_DEADLINE: {
        icon: Target,
        chip: 'bg-primary/10 text-primary',
        dot: 'bg-primary',
        label: 'Goal deadline',
    },
    BUDGET_START: {
        icon: Flag,
        chip: 'bg-warning/10 text-warning',
        dot: 'bg-warning',
        label: 'Budget starts',
    },
    BUDGET_END: {
        icon: Flag,
        chip: 'bg-warning/10 text-warning',
        dot: 'bg-warning',
        label: 'Budget ends',
    },
};

export function CalendarEventChip({ event }: { event: CalendarEvent }) {
    const style = EVENT_STYLES[event.kind];
    const Icon = style.icon;
    return (
        <div
            aria-hidden="true"
            className={cn(
                'flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
                style.chip,
                event.isProjected && 'border border-dashed border-current',
            )}
        >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.title}</span>
        </div>
    );
}
