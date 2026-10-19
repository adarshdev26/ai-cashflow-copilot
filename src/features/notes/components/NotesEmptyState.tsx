'use client';

import { StickyNote, SearchX, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotesEmptyStateProps {
    type: 'empty' | 'no-results' | 'error';
    onAction?: () => void;
    errorMessage?: string;
}

export function NotesEmptyState({ type, onAction, errorMessage }: NotesEmptyStateProps) {
    if (type === 'error') {
        return (
            <div className="border-base-300 bg-base-100 flex flex-col items-center justify-center rounded-2xl border p-12 text-center shadow-xs">
                <div className="bg-error/10 text-error mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base-content text-lg font-semibold">
                    Failed to load financial notes
                </h3>
                <p className="text-base-content/60 mt-1 max-w-md text-sm">
                    {errorMessage ||
                        'An error occurred while loading your notes. Please check your connection and try again.'}
                </p>
                {onAction && (
                    <Button
                        variant="secondary"
                        onClick={onAction}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                        className="mt-6"
                    >
                        Try Again
                    </Button>
                )}
            </div>
        );
    }

    if (type === 'no-results') {
        return (
            <div className="border-base-300 bg-base-100 flex flex-col items-center justify-center rounded-2xl border p-12 text-center shadow-xs">
                <div className="bg-base-200 text-base-content/50 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <SearchX className="h-7 w-7" />
                </div>
                <h3 className="text-base-content text-lg font-semibold">No matching notes found</h3>
                <p className="text-base-content/60 mt-1 max-w-md text-sm">
                    We couldn’t find any notes matching your search or active filters. Try adjusting
                    your search query or clearing filters.
                </p>
                {onAction && (
                    <Button variant="secondary" onClick={onAction} className="mt-6">
                        Reset Filters
                    </Button>
                )}
            </div>
        );
    }

    // Default 'empty' state: No financial notes found
    return (
        <div className="border-base-300 bg-base-100 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center shadow-xs">
            <div className="bg-primary/10 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <StickyNote className="h-8 w-8" />
            </div>
            <h3 className="text-base-content text-xl font-semibold">No financial notes found</h3>
            <p className="text-base-content/60 mt-2 max-w-md text-sm">
                Keep track of upcoming bills, investment strategies, budget reminders, and tax
                deadlines in one organized workspace.
            </p>
            {onAction && (
                <Button
                    variant="primary"
                    onClick={onAction}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="mt-6"
                >
                    Create your first note
                </Button>
            )}
        </div>
    );
}
