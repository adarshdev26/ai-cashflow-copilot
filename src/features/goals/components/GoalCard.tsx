'use client';

import { Archive, ArchiveRestore, CircleMinus, CirclePlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/features/budgets/utils';
import type { Goal, GoalDisplayStatus } from '../types';

type Props = {
    goal: Goal;
    locale: string;
    canManage: boolean;
    onEdit: (goal: Goal) => void;
    onContribute: (goal: Goal, kind: 'ADD' | 'REMOVE') => void;
    onArchive: (goal: Goal) => void;
    onRestore: (goal: Goal) => void;
};

const statusPresentation: Record<GoalDisplayStatus, { label: string; badge: string }> = {
    ACTIVE: { label: 'Active', badge: 'badge-info' },
    COMPLETED: { label: 'Completed', badge: 'badge-success' },
    OVERDUE: { label: 'Overdue', badge: 'badge-error' },
    ARCHIVED: { label: 'Archived', badge: 'badge-ghost' },
};

export function GoalCard({
    goal,
    locale,
    canManage,
    onEdit,
    onContribute,
    onArchive,
    onRestore,
}: Props) {
    const status = statusPresentation[goal.displayStatus];
    return (
        <article className="border-base-300 bg-base-100 space-y-4 rounded-xl border p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-base-content truncate text-lg font-semibold">
                        {goal.name}
                    </h2>
                    {goal.description && (
                        <p className="text-base-content/60 mt-1 line-clamp-2 text-sm">
                            {goal.description}
                        </p>
                    )}
                </div>
                <span className={`badge badge-sm shrink-0 ${status.badge}`}>{status.label}</span>
            </div>
            <div>
                <progress
                    className="progress progress-primary w-full"
                    value={goal.percentageCompleted}
                    max={100}
                    aria-label={`${goal.name} progress`}
                />
                <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="text-base-content font-semibold">
                        {formatINR(goal.currentAmount, locale)} /{' '}
                        {formatINR(goal.targetAmount, locale)}
                    </span>
                    <span className="text-base-content/70">
                        {Math.round(goal.percentageCompleted)}%
                    </span>
                </div>
                <div className="text-base-content/60 mt-2 flex flex-wrap justify-between gap-2 text-xs">
                    <span>{formatINR(goal.remainingAmount, locale)} remaining</span>
                    <span>
                        Target:{' '}
                        {new Intl.DateTimeFormat(locale, {
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                        }).format(new Date(goal.targetDate))}
                    </span>
                </div>
                {goal.displayStatus !== 'COMPLETED' && goal.displayStatus !== 'ARCHIVED' && (
                    <p className="text-base-content/70 mt-2 text-xs">
                        {goal.requiredMonthlyContribution === null
                            ? 'Target date passed'
                            : `Monthly contribution: ${formatINR(goal.requiredMonthlyContribution, locale)}`}
                    </p>
                )}
            </div>
            {canManage && goal.displayStatus === 'ARCHIVED' ? (
                <div className="border-base-200 flex items-center gap-2 border-t pt-3">
                    <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Restore ${goal.name}`}
                        onClick={() => onRestore(goal)}
                    >
                        <ArchiveRestore className="h-4 w-4" /> Restore
                    </Button>
                </div>
            ) : canManage ? (
                <div className="border-base-200 flex flex-wrap items-center gap-2 border-t pt-3">
                    <Button
                        size="sm"
                        aria-label={`Add money to ${goal.name}`}
                        onClick={() => onContribute(goal, 'ADD')}
                    >
                        <CirclePlus className="h-4 w-4" /> Add money
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Remove money from ${goal.name}`}
                        onClick={() => onContribute(goal, 'REMOVE')}
                        disabled={goal.currentAmount <= 0}
                    >
                        <CircleMinus className="h-4 w-4" /> Remove
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Edit ${goal.name}`}
                        onClick={() => onEdit(goal)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Archive ${goal.name}`}
                        onClick={() => onArchive(goal)}
                    >
                        <Archive className="h-4 w-4" />
                    </Button>
                </div>
            ) : null}
        </article>
    );
}
