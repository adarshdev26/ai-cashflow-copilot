'use client';

import { useState } from 'react';
import {
    CheckCircle2,
    Circle,
    Edit2,
    Trash2,
    Calendar,
    ChevronDown,
    ChevronUp,
    IndianRupee,
    Pin,
    RotateCcw,
    Archive,
} from 'lucide-react';
import type { Note } from '../types';
import { NoteCategoryBadge, NotePriorityBadge } from './NoteBadges';
import { formatCurrencyAmount } from '@/components/ui/chart/chart-formatters';
import { useUserLocale } from '@/features/settings/hooks/use-settings';

interface NoteCardProps {
    note: Note;
    currency?: string;
    onEdit: (note: Note) => void;
    onDelete: (note: Note) => void;
    onToggle: (note: Note) => void;
    onPin?: (note: Note) => void;
    onRestore?: (note: Note) => void;
    isToggling?: boolean;
    isPinning?: boolean;
    isRestoring?: boolean;
}

export function NoteCard({
    note,
    currency = 'INR',
    onEdit,
    onDelete,
    onToggle,
    onPin,
    onRestore,
    isToggling = false,
    isPinning = false,
    isRestoring = false,
}: NoteCardProps) {
    const locale = useUserLocale();
    const [isExpanded, setIsExpanded] = useState(false);

    const isArchived = Boolean(note.deletedAt);

    const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const isLongContent = note.content.length > 180;

    return (
        <div
            className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
                isArchived
                    ? 'border-base-300/80 bg-base-200/30 border-dashed opacity-85 shadow-xs'
                    : note.isPinned
                      ? 'border-primary/40 bg-base-100 hover:border-primary/60 shadow-md ring-1 ring-primary/20'
                      : note.isCompleted
                        ? 'border-base-300/60 bg-base-100/60 opacity-80 shadow-xs'
                        : 'border-base-300 bg-base-100 hover:border-primary/30 shadow-sm hover:shadow-md'
            }`}
        >
            <div>
                {/* Header row: Pin badge (if pinned) + Status toggle + Title + Action buttons */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <button
                            type="button"
                            onClick={() => !isArchived && onToggle(note)}
                            disabled={isToggling || isArchived}
                            title={
                                isArchived
                                    ? 'Archived note'
                                    : note.isCompleted
                                      ? 'Mark as pending'
                                      : 'Mark as completed'
                            }
                            aria-label={note.isCompleted ? 'Mark as pending' : 'Mark as completed'}
                            className={`mt-0.5 shrink-0 transition-colors ${
                                isArchived
                                    ? 'text-base-content/30 cursor-not-allowed'
                                    : 'text-base-content/40 hover:text-primary disabled:opacity-50'
                            }`}
                        >
                            {note.isCompleted ? (
                                <CheckCircle2 className="text-success h-5 w-5 transition-transform group-hover:scale-105" />
                            ) : (
                                <Circle className="hover:text-primary h-5 w-5" />
                            )}
                        </button>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {note.isPinned && !isArchived && (
                                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                        <Pin className="h-3 w-3 fill-primary" />
                                        Pinned
                                    </span>
                                )}
                                {isArchived && (
                                    <span className="inline-flex items-center gap-1 rounded bg-base-300/70 px-1.5 py-0.5 text-[10px] font-semibold text-base-content/60">
                                        <Archive className="h-3 w-3" />
                                        Archived
                                    </span>
                                )}
                            </div>
                            <h3
                                className={`mt-0.5 text-base font-semibold tracking-tight break-words transition-colors ${
                                    note.isCompleted || isArchived
                                        ? 'text-base-content/50 line-through'
                                        : 'text-base-content'
                                }`}
                            >
                                {note.title}
                            </h3>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-1">
                        {isArchived ? (
                            /* Restore button for soft-deleted note */
                            <button
                                type="button"
                                onClick={() => onRestore?.(note)}
                                disabled={isRestoring}
                                title="Restore note"
                                aria-label="Restore note"
                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Restore</span>
                            </button>
                        ) : (
                            <>
                                {/* Pin Toggle Button */}
                                <button
                                    type="button"
                                    onClick={() => onPin?.(note)}
                                    disabled={isPinning}
                                    title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                                    aria-label={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                                    className={`rounded-md p-1.5 transition-colors ${
                                        note.isPinned
                                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                            : 'text-base-content/60 hover:bg-base-200 hover:text-base-content opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                                    }`}
                                >
                                    <Pin
                                        className={`h-4 w-4 ${note.isPinned ? 'fill-primary' : ''}`}
                                    />
                                </button>

                                {/* Edit Button */}
                                <button
                                    type="button"
                                    onClick={() => onEdit(note)}
                                    title="Edit note"
                                    aria-label="Edit note"
                                    className="text-base-content/60 hover:bg-base-200 hover:text-base-content rounded-md p-1.5 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>

                                {/* Soft-Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => onDelete(note)}
                                    title="Archive note (soft delete)"
                                    aria-label="Archive note"
                                    className="text-error/70 hover:bg-error/10 hover:text-error rounded-md p-1.5 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-3 pl-8">
                    <p
                        className={`text-base-content/70 text-sm break-words whitespace-pre-wrap ${
                            !isExpanded && isLongContent ? 'line-clamp-3' : ''
                        }`}
                    >
                        {note.content}
                    </p>

                    {isLongContent && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary hover:text-primary-focus mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
                        >
                            {isExpanded ? (
                                <>
                                    Show less <ChevronUp className="h-3 w-3" />
                                </>
                            ) : (
                                <>
                                    Read more <ChevronDown className="h-3 w-3" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Footer row: Badges, Amount, Date */}
            <div className="border-base-200 mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t pt-3 pl-8 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <NoteCategoryBadge category={note.category} />
                    <NotePriorityBadge priority={note.priority} />

                    {note.amount != null && (
                        <span className="bg-primary/5 text-primary border-primary/10 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold">
                            {currency === 'INR' ? <IndianRupee className="h-3 w-3" /> : null}
                            <span>{formatCurrencyAmount(note.amount, currency, locale)}</span>
                        </span>
                    )}
                </div>

                <div className="text-base-content/50 flex items-center gap-1.5 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                </div>
            </div>
        </div>
    );
}

export function NoteCardSkeleton() {
    return (
        <div className="border-base-300 bg-base-100 flex animate-pulse flex-col justify-between rounded-xl border p-5 shadow-sm">
            <div>
                <div className="flex items-start gap-3">
                    <div className="bg-base-200 mt-0.5 h-5 w-5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="bg-base-200 h-5 w-3/4 rounded" />
                        <div className="bg-base-200 h-4 w-full rounded" />
                        <div className="bg-base-200 h-4 w-5/6 rounded" />
                    </div>
                </div>
            </div>
            <div className="border-base-200 mt-6 flex items-center justify-between border-t pt-3 pl-8">
                <div className="flex gap-2">
                    <div className="bg-base-200 h-5 w-16 rounded" />
                    <div className="bg-base-200 h-5 w-14 rounded" />
                </div>
                <div className="bg-base-200 h-4 w-20 rounded" />
            </div>
        </div>
    );
}
