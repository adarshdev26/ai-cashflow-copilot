import type { NoteCategory, NotePriority } from '../types';

interface NoteCategoryBadgeProps {
    category: NoteCategory;
    className?: string;
}

const CATEGORY_STYLES: Record<NoteCategory, { label: string; className: string }> = {
    GENERAL: {
        label: 'General',
        className: 'bg-base-200 text-base-content/80 border-base-300',
    },
    BUDGET: {
        label: 'Budget',
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    INVESTMENT: {
        label: 'Investment',
        className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    TAX: {
        label: 'Tax',
        className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    EXPENSE: {
        label: 'Expense',
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
};

export function NoteCategoryBadge({ category, className = '' }: NoteCategoryBadgeProps) {
    const config = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.GENERAL;
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide ${config.className} ${className}`}
        >
            {config.label}
        </span>
    );
}

interface NotePriorityBadgeProps {
    priority: NotePriority;
    className?: string;
}

const PRIORITY_STYLES: Record<
    NotePriority,
    { label: string; dotClass: string; badgeClass: string }
> = {
    LOW: {
        label: 'Low',
        dotClass: 'bg-slate-400',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    },
    MEDIUM: {
        label: 'Medium',
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    HIGH: {
        label: 'High',
        dotClass: 'bg-rose-500',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
};

export function NotePriorityBadge({ priority, className = '' }: NotePriorityBadgeProps) {
    const config = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${config.badgeClass} ${className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
            {config.label}
        </span>
    );
}
