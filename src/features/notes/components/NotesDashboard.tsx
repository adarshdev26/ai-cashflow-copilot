'use client';

import { useMemo, useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { notify, getErrorMessage } from '@/lib/ui/toast';
import { useWorkspace } from '@/features/workspaces/WorkspaceProvider';
import {
    useNotes,
    useToggleNote,
    useDeleteNote,
    usePinNote,
    useRestoreNote,
} from '../hooks/use-notes';
import type { Note, NoteFilters } from '../types';
import { NoteCard, NoteCardSkeleton } from './NoteCard';
import { NoteFormModal } from './NoteFormModal';
import { NotesSummary } from './NotesSummary';
import { NotesFiltersBar } from './NotesFiltersBar';
import { NotesEmptyState } from './NotesEmptyState';
import { useDebounce } from '@/hooks/useDebounce';

export function NotesDashboard() {
    const { active } = useWorkspace();
    const currency = 'INR';
    const canManage = active?.role !== 'VIEWER';

    // Filters state
    const [rawFilters, setRawFilters] = useState<NoteFilters>({
        search: '',
        status: 'ALL',
        category: 'ALL',
        sortBy: 'createdAt',
        sortDir: 'desc',
    });

    // Debounce search query so server queries stay lightweight
    const debouncedSearch = useDebounce(rawFilters.search ?? '', 300);

    const queryFilters = useMemo(
        () => ({
            ...rawFilters,
            search: debouncedSearch.trim(),
        }),
        [rawFilters, debouncedSearch],
    );

    const { data, isLoading, isError, error, refetch } = useNotes(queryFilters);

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Delete dialog states
    const [deletingNote, setDeletingNote] = useState<Note | null>(null);
    const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

    // Mutations
    const toggleMutation = useToggleNote();
    const deleteMutation = useDeleteNote();
    const pinMutation = usePinNote();
    const restoreMutation = useRestoreNote();

    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [pinningId, setPinningId] = useState<string | null>(null);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const notes = data?.notes ?? [];
    const summary = data?.summary ?? {
        total: 0,
        completed: 0,
        pending: 0,
        archived: 0,
        totalAmount: 0,
    };

    const handleCreateClick = () => {
        setEditingNote(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (note: Note) => {
        setEditingNote(note);
        setIsFormOpen(true);
    };

    const handleToggleClick = async (note: Note) => {
        if (!canManage) {
            notify.error('You do not have permission to modify notes');
            return;
        }

        setTogglingId(note.id);
        try {
            await toggleMutation.mutateAsync(note.id);
            notify.success(
                note.isCompleted ? 'Note marked as pending' : 'Note marked as completed',
            );
        } catch (err) {
            console.error('Failed to toggle note:', err);
            notify.error(getErrorMessage(err, 'Failed to update note status'));
        } finally {
            setTogglingId(null);
        }
    };

    const handlePinClick = async (note: Note) => {
        if (!canManage) {
            notify.error('You do not have permission to modify notes');
            return;
        }

        setPinningId(note.id);
        try {
            await pinMutation.mutateAsync(note.id);
            notify.success(note.isPinned ? 'Note unpinned' : 'Note pinned to top');
        } catch (err) {
            console.error('Failed to pin note:', err);
            notify.error(getErrorMessage(err, 'Failed to update pin status'));
        } finally {
            setPinningId(null);
        }
    };

    const handleRestoreClick = async (note: Note) => {
        if (!canManage) {
            notify.error('You do not have permission to restore notes');
            return;
        }

        setRestoringId(note.id);
        try {
            await restoreMutation.mutateAsync(note.id);
            notify.success('Note restored successfully');
        } catch (err) {
            console.error('Failed to restore note:', err);
            notify.error(getErrorMessage(err, 'Failed to restore note'));
        } finally {
            setRestoringId(null);
        }
    };

    const handleDeleteClick = (note: Note) => {
        setDeleteError(undefined);
        setDeletingNote(note);
    };

    const confirmDelete = async () => {
        if (!deletingNote) return;

        try {
            await deleteMutation.mutateAsync(deletingNote.id);
            notify.success('Note moved to archive. You can restore it anytime from the Archived tab.');
            setDeletingNote(null);
        } catch (err) {
            console.error('Failed to archive note:', err);
            const msg = getErrorMessage(err, 'Failed to archive note');
            setDeleteError(msg);
            notify.error(msg);
        }
    };

    const handleResetFilters = () => {
        setRawFilters({
            search: '',
            status: 'ALL',
            category: 'ALL',
            sortBy: 'createdAt',
            sortDir: 'desc',
        });
    };

    const isFiltered = Boolean(
        rawFilters.search?.trim() ||
        rawFilters.status !== 'ALL' ||
        rawFilters.category !== 'ALL' ||
        rawFilters.sortBy !== 'createdAt' ||
        rawFilters.sortDir !== 'desc',
    );

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                            <StickyNote className="h-5 w-5" />
                        </div>
                        <h1 className="text-base-content text-2xl font-bold tracking-tight">
                            Financial Notes
                        </h1>
                    </div>
                    <p className="text-base-content/60 mt-1 text-sm">
                        Keep track of budgets, expenses, and financial reminders.
                    </p>
                </div>

                {canManage && (
                    <Button
                        variant="primary"
                        onClick={handleCreateClick}
                        leftIcon={<Plus className="h-4 w-4" />}
                        className="shadow-sm"
                    >
                        Add Note
                    </Button>
                )}
            </div>

            {/* Summary Metrics */}
            <NotesSummary
                total={summary.total}
                pending={summary.pending}
                completed={summary.completed}
                totalAmount={summary.totalAmount}
                currency={currency}
                isLoading={isLoading && !data}
            />

            {/* Filters Bar */}
            <NotesFiltersBar
                filters={rawFilters}
                onFiltersChange={setRawFilters}
                onReset={handleResetFilters}
                totalCount={summary.total}
                filteredCount={notes.length}
                archivedCount={summary.archived}
            />

            {/* Main Content: Notes Grid or State Displays */}
            {isLoading && !data ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <NoteCardSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <NotesEmptyState
                    type="error"
                    onAction={() => refetch()}
                    errorMessage={error instanceof Error ? error.message : undefined}
                />
            ) : notes.length === 0 ? (
                rawFilters.status === 'ARCHIVED' ? (
                    <div className="border-base-300 bg-base-100 rounded-xl border p-12 text-center shadow-xs">
                        <div className="bg-base-200 text-base-content/50 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                            <StickyNote className="h-6 w-6" />
                        </div>
                        <h3 className="text-base-content mt-4 text-base font-semibold">
                            No archived notes
                        </h3>
                        <p className="text-base-content/60 mx-auto mt-1 max-w-sm text-sm">
                            When you delete a note, it is saved in your archive so you can activate and restore it anytime.
                        </p>
                    </div>
                ) : isFiltered ? (
                    <NotesEmptyState type="no-results" onAction={handleResetFilters} />
                ) : (
                    <NotesEmptyState
                        type="empty"
                        onAction={canManage ? handleCreateClick : undefined}
                    />
                )
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            currency={currency}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onToggle={handleToggleClick}
                            onPin={handlePinClick}
                            onRestore={handleRestoreClick}
                            isToggling={togglingId === note.id}
                            isPinning={pinningId === note.id}
                            isRestoring={restoringId === note.id}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Note Modal */}
            <NoteFormModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingNote(null);
                }}
                editingNote={editingNote}
                currency={currency}
            />

            {/* Confirm Archive Dialog (Soft delete) */}
            <ConfirmDialog
                isOpen={Boolean(deletingNote)}
                onClose={() => {
                    if (!deleteMutation.isPending) {
                        setDeletingNote(null);
                        setDeleteError(undefined);
                    }
                }}
                title="Archive Note"
                description={
                    deletingNote
                        ? `Are you sure you want to archive "${deletingNote.title}"? It will not be permanently deleted and can be activated/restored anytime from the Archived tab.`
                        : 'Are you sure you want to archive this note?'
                }
                confirmText="Archive Note"
                variant="danger"
                onConfirm={confirmDelete}
                loading={deleteMutation.isPending}
                error={deleteError}
            />
        </div>
    );
}
